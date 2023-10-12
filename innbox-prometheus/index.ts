import { ConnectOptions, Telnet } from "telnet-client";
import client from "prom-client";

const up = new client.Gauge({
    name: "router_up",
    help: "1 if the router gets scraped successfully",
});

const rxBytes = new client.Gauge({
        name: "rx_bytes",
        help: "Bytes received",
        labelNames: ["iface"],
    }),
    txBytes = new client.Gauge({
        name: "tx_bytes",
        help: "Bytes sent",
        labelNames: ["iface"],
    }),
    rxPackets = new client.Gauge({
        name: "rx_packets",
        help: "Packets received",
        labelNames: ["iface"],
    }),
    txPackets = new client.Gauge({
        name: "tx_packets",
        help: "Packets sent",
        labelNames: ["iface"],
    }),
    rxPacketsDropped = new client.Gauge({
        name: "rx_packets_drop",
        help: "Dropped incoming packets",
        labelNames: ["iface"],
    }),
    txPacketsDropped = new client.Gauge({
        name: "tx_packets_drop",
        help: "Dropped outgoin packets",
        labelNames: ["iface"],
    }),
    rxPacketsErrored = new client.Gauge({
        name: "rx_packets_error",
        help: "Packets not received",
        labelNames: ["iface"],
    }),
    txPacketsErrored = new client.Gauge({
        name: "tx_packets_error",
        help: "Packets not sent",
        labelNames: ["iface"],
    });

async function goTelnet(host: string, username: string, password: string) {
    const tn = new Telnet();

    await tn.connect({
        host,
        username,
        password,

        debug: true,

        loginPrompt: "login as: ",
        shellPrompt: "InnboxG78 # ",
        passwordPrompt: "password: ",

        port: 23,
    } satisfies ConnectOptions);

    const ipLinkShow = await tn.exec("ip -s -s -o link show");
    const uptime = await tn.exec("uptime");

    tn.end();

    console.log(`Router uptime: ${uptime}`);

    return { ipLinkShow, uptime };
}

type IfStatKey = "bytes" | "packets" | "errors" | "dropped";
type IfStats = Record<IfStatKey, number>;

type Iface = {
    ifname: string;
    rx: IfStats;
    tx: IfStats;
};

const RXTX_LABELS: IfStatKey[] = ["bytes", "packets", "errors", "dropped"];

function parseIpLinkShow(output: string) {
    return output
        .split("\n")
        .filter((x) => x.length > 1)
        .map((line) => {
            const [info, , , rxStr, , , , txStr] = line
                .split("\\")
                .map((x) => x.trim().replace(/\s+/g, " "));

            const ifname = info.split(":")[1].trim();

            //ignore rxe and txe (errors) for now;

            const iface: Iface = {
                ifname,
                rx: Object.fromEntries(
                    rxStr
                        .split(" ")
                        .slice(0, 4)
                        .map((val, i) => [RXTX_LABELS[i], parseInt(val)])
                ) as IfStats,
                tx: Object.fromEntries(
                    txStr
                        .split(" ")
                        .slice(0, 4)
                        .map((val, i) => [RXTX_LABELS[i], parseInt(val)])
                ) as IfStats,
            };

            return iface;
        });
}

async function scrape() {
    try {
        const res = await goTelnet(
            process.env.RT_HOST ?? "192.168.1.1",
            process.env.RT_USER ?? "admin",
            process.env.RT_PASSWD ?? "admin"
        );

        const ipLink = parseIpLinkShow(res.ipLinkShow);

        up.set(1);

        ipLink.forEach((i) => {
            rxBytes.labels(i.ifname).set(i.rx.bytes);
            rxPackets.labels(i.ifname).set(i.rx.packets);
            rxPacketsDropped.labels(i.ifname).set(i.rx.dropped);
            rxPacketsErrored.labels(i.ifname).set(i.rx.errors);

            txBytes.labels(i.ifname).set(i.tx.bytes);
            txPackets.labels(i.ifname).set(i.tx.packets);
            txPacketsDropped.labels(i.ifname).set(i.tx.dropped);
            txPacketsErrored.labels(i.ifname).set(i.tx.errors);
        });
    } catch (e) {
        up.set(0);

        console.error("failed to scrape", e);
    }
}

await scrape();

setInterval(scrape, 30_000);

Bun.serve({
    async fetch(r, s) {
        return new Response(
            "# Innbox G78 Prometheus Exporter\n\n" +
                (await client.register.metrics()),
            {
                headers: { "Content-Type": client.register.contentType },
            }
        );
    },
});

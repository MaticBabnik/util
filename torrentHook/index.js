/// <reference path="./node_modules/bun-types/types.d.ts" />

const { WebhookClient, MessageEmbed } = require("discord.js");
const config = JSON.parse(require("fs").readFileSync(`${__dirname}/.env.json`));

async function main(args) {
    const client = new WebhookClient({
        url: config.qbWebhookUrl,
    });

    let [name, category, size] = args;

    size = Math.round(size / (1 << 20)); //size MiB1

    client.send({
        embeds: [
            new MessageEmbed({
                color: "#18e2ad",
                url: config.qbUrl,
                author: {
                    name: config.qbName,
                    icon_url: config.qbIconUrl,
                },
                title: `✅ ${name}`,
                fields: [
                    { name: "Category", value: category, inline: true },
                    {
                        name: "Size",
                        value:
                            size >= 1024
                                ? `${Math.round(size / 1024)} GiB`
                                : `${size} MiB`,
                        inline: true,
                    },
                ],
                timestamp: Date.now(),
            }),
        ],
    });
}

main(process.argv.slice(2));

# Innbox Prometheus exporter

Exports traffic (bytes/packets) on interfaces from the Innbox G78 router over telnet.

## Config

| Variable    | Default     | Explanation                |
| ----------- | ----------- | -------------------------- |
| `RT_USER`   | admin       | Username for telnet access |
| `RT_PASSWD` | admin       | Password for telnet access |
| `RT_HOST`   | 192.168.1.1 | IP/Hostname of the router  |
| `PORT`      | 3000        | Port for the metrics       |

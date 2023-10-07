const needle = require('needle');
const { merge } = require('lodash')
/*
    A minimalistic Qbittorrent webUI api client.
*/
class Qbc {
    constructor(baseUrl, auth) {
        this.up = false;
        this.baseUrl = baseUrl;
        this.rid = 0;
        this.state = {};
        this.lastResponseTime = 0;

        this.refetchData();
    }

    async refetchData() {
        const start = Date.now();
        try {
            const url = new URL(this.baseUrl);
            url.pathname = '/api/v2/sync/maindata';
            if (this.rid != 0) url.searchParams.append('rid', this.rid);
            const res = await needle('get', url.toString());
            this.rid++;
            if (res.body.fullUpdate) {
                this.state = res.body;
            } else {
                merge(this.state, res.body);
                res.body.torrents_removed?.forEach(hash=> delete this.state[hash])
            }
            this.state = res.body;
            this.up = true;
        } catch (e) {
            console.error("Error fetching data, assuming qb is down: ");
            console.error(e);

            this.up = false;
            this.rid = 0;
        }
        this.lastResponseTime = Date.now() - start;
    }

}
module.exports = Qbc;
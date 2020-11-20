const { shell } = require('electron');
const { get, post } = require('powercord/http');
const { Plugin } = require('powercord/entities');
const { getModule, React } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { PersonShield } = require('powercord/components/Icons');

const Settings = require('./components/Settings');

class VirusChecker extends Plugin {
    async startPlugin() {
        this.loadStylesheet('styles.css');
        this.registerSettings();

        const Attachment = await getModule(['AttachmentUpload']);
        const props = {
            ...await getModule(['anchorUnderlineOnHover']),
            ...await getModule(['attachment', 'downloadButton'])
        }

        const key = this.settings.get('apiKey', '');

        inject('virus-checker', Attachment, 'default', (args, res) => {
            res.props.children.splice(
                2,
                0,
                React.createElement(PersonShield, {
                    className: `${props.anchor} ${props.downloadButton} vc`,
                    onClick: async () => {
                        if (!key) {
                            return this.toast({
                                id: 'VirusNoKey',
                                header: 'Error occurred',
                                content: "You didn't provide an API key! Get this by following the instructions on the GitHub repo."
                            });
                        }

                        const req = post('https://virustotal.com/api/v3/urls');
                        req.set('x-apikey', key);
                        req.set('Content-Type', 'application/x-www-form-urlencoded');

                        try {
                            this.toast({
                                id: 'VirusLoading',
                                header: 'Loading...',
                                content: "Rome wasn't built in a day...",
                                color: 'green'
                            });

                            const { body: { data } } = await req.send({ url: args[0].url });

                            const req2 = get(`https://www.virustotal.com/api/v3/analyses/${data.id}`);
                            req2.set('x-apikey', key);
                            req2.set('Content-Type', 'application/x-www-form-urlencoded');

                            const { body } = await req2.execute();
                            return this.openBrowser(body.meta.url_info.id);
                        } catch (err) {
                            return this.toast({
                                id: 'VirusFetchError',
                                header: 'Error occurred',
                                content: `${err.message}. Make sure you provided a valid API key!`
                            });
                        } finally {
                            powercord.api.notices.closeToast('VirusLoading');
                        }
                    }
                })
            );

            return res;
        });
        Attachment.default.displayName = 'Attachment';
    }

    registerSettings() {
        powercord.api.settings.registerSettings('virus-checker-settings', {
            category: this.entityID,
            label: 'Virus Checker',
            render: Settings,
        });
    }

    toast({ id, header, content, color = 'red' }) {
        return powercord.api.notices.sendToast(id, {
            header,
            content,
            type: 'info',
            timeout: 10e3,
            buttons: [{
                text: 'Got It',
                color,
                size: 'medium',
                look: 'outlined',
            }]
        });
    }

    async openBrowser(id) {
        try {
            return shell.openExternal(`https://www.virustotal.com/gui/url/${id}/detection`);
        } catch (err) {
            return this.toast({
                id: 'VirusBrowserError',
                header: 'Error occurred',
                content: `Failed to open browser: ${err.message}.`
            });
        }
    }

    pluginWillUnload() {
        uninject('virus-checker');
    }
}

module.exports = VirusChecker;
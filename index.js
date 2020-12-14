const i18n = require('./i18n');
const { shell } = require('electron');
const { get, post } = require('powercord/http');
const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { PersonShield } = require('powercord/components/Icons');
const {
    getModule,
    React,
    i18n: { Messages }
} = require('powercord/webpack');

const Settings = require('./components/Settings');

class VirusChecker extends Plugin {
    async startPlugin() {
        this.loadStylesheet('styles.css');
        powercord.api.i18n.loadAllStrings(i18n);
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
                                header: Messages.VC_ERROR,
                                content: Messages.NO_KEY
                            });
                        }

                        const req = post('https://virustotal.com/api/v3/urls');
                        req.set('x-apikey', key);
                        req.set('Content-Type', 'application/x-www-form-urlencoded');

                        try {
                            this.toast({
                                id: 'VirusLoading',
                                header: Messages.VC_LOADING,
                                content: Messages.VC_LOADING_DESC,
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
                                header: Messages.VC_ERROR,
                                content: `${err.message}. ${Messages.VC_MAKE_SURE}`
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
            label: Messages.VIRUS_CHECKER,
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
                text: Messages.GOT_IT,
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
                header: Messages.VC_ERROR,
                content: `${Messages.FAILED_BROWSER} ${err.message}.`
            });
        }
    }

    pluginWillUnload() {
        uninject('virus-checker');
    }
}

module.exports = VirusChecker;
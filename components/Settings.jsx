const { TextInput } = require('powercord/components/settings');
const { React, i18n: { Messages } } = require('powercord/webpack');

module.exports = ({ getSetting, updateSetting }) => (
    <div>
        <TextInput
            note={Messages.YOUR_KEY}
            defaultValue={getSetting('apiKey', '')}
            required={true}
            onChange={val => updateSetting('apiKey', val)}
        >
            {Messages.API_KEY}
        </TextInput>
    </div>
);
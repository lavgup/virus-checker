const { React } = require('powercord/webpack');
const { TextInput } = require('powercord/components/settings');

module.exports = ({ getSetting, updateSetting }) => (
    <div>
        <TextInput
            note="Your API key. Don't share this with anyone else."
            defaultValue={getSetting('apiKey', '')}
            required={true}
            onChange={val => updateSetting('apiKey', val)}
        >
            API Key
        </TextInput>
    </div>
);
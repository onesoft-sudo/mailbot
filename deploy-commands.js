const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { config } = require('dotenv');

config();

const rest = new REST({
    version: '10'
}).setToken(process.env.TOKEN);

const slashCommands = [
    new SlashCommandBuilder()
        .setName('close')
        .setDescription('Closes a mail thread')
        .addStringOption(opt => opt.setName('close_in').setDescription('Set the closing timeout for this thread'))
        .addStringOption(opt => opt.setName('reason').setDescription('The reason for closing this thread'))
        .addBooleanOption(opt => opt.setName('delete').setDescription('Delete the thread channel (default is: false)')),
    new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Deletes a mail thread channel (also closes if not closed)')
        .addStringOption(opt => opt.setName('reason').setDescription('The reason for deleting this thread'))
        .addBooleanOption(opt => opt.setName('silent').setDescription('Close silently without DMing the user')),
    new SlashCommandBuilder()
        .setName('block')
        .setDescription('Block a member from using MailBot')
        .addUserOption(opt => opt.setName('user').setDescription('The user to be blocked').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('The reason for blocking this user'))
        .addBooleanOption(opt => opt.setName('notify').setDescription('Notify the user about this block')),
    new SlashCommandBuilder()
        .setName('unblock')
        .setDescription('Unblock a member')
        .addUserOption(opt => opt.setName('user').setDescription('The user to be unblocked').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('The reason for unblocking this user'))
        .addBooleanOption(opt => opt.setName('notify').setDescription('Notify the user about this unblock')),
    new SlashCommandBuilder()
        .setName('reply')
        .setDescription('Replies to a mail thread (DMs the thread author)')
        .addStringOption(opt => opt.setName('message').setDescription('The message to send').setRequired(true))
        .addBooleanOption(opt => opt.setName('anonymous').setDescription('Anonymous reply (Defaults to false)'))
        .addAttachmentOption(opt => opt.setName('attachment').setDescription('Attachment to send')),
    new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Edit a message sent by MailBot')
        .addStringOption(opt => opt.setName('message').setDescription('The ID of the message to edit').setRequired(true))
        .addStringOption(opt => opt.setName('content').setDescription('The new content of the message').setRequired(true))
];

const contextMenuCommands = [];

const commands = [...slashCommands, ...contextMenuCommands].map(cmd => cmd.toJSON());

rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
    .then(() => console.log('Successfully registered application guild commands.'))
    .catch(console.error);
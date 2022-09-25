import { Client, Message, ChatInputCommandInteraction, CacheType, MessageContextMenuCommandInteraction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, User, ComponentType, Embed, EmbedBuilder } from "discord.js";
import DiscordClient from "../../client/Client";
import StaffMessage from "../../models/StaffMessage";
import Thread from "../../models/Thread";
import CommandOptions from "../../types/CommandOptions";
import BaseCommand from "../../utils/structures/BaseCommand";
import { getGuild } from "../../utils/utils";
import { updateReply } from "./EditCommand";

export default class EditThreadMessageCommand extends BaseCommand {   
    public mailOnly: boolean = true;
    public messageContextMenu: boolean = true;
    public legacy: boolean = false;

    constructor() {
        super('Edit Thread Message', 'mailing', []);
    }

    async run(client: DiscordClient, interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
        const thread = await Thread.findOne({ channel: interaction.channel!.id });

        if (!thread) {
            await interaction.reply({
                content: 'This thread is already closed or deleted.',
                ephemeral: true
            });

            return;
        }

        const { id, author } = interaction.targetMessage;
        
        if (author.id !== client.user?.id) {
            await interaction.reply({
                content: 'You must attempt to edit a message sent by the bot!',
                ephemeral: true
            });

            return;
        }
        
        try {
            const member = await (getGuild(client)?.members.fetch(thread.user));

            if (!member) {
                throw new Error();
            }
            
            const staffMessage = await StaffMessage.findOne({ threadMessageID: id });

            if (!staffMessage) {
                throw new Error();
            }

            if (staffMessage.authorID !== interaction.member?.user.id) {
                await interaction.reply({
                    content: 'You can only edit messages sent by you!',
                    ephemeral: true
                });
    
                return;
            }

            if (!member.dmChannel) {
                console.log('Reloading DM channel...');

                try {
                    await member.createDM(true);
                }
                catch (e) {
                    console.log(e);
                }
            }

            const message = await member.dmChannel!.messages.fetch(staffMessage!.dmID);

            console.log(message);

            if (!message) {
                throw new Error();
            }

            const modal = new ModalBuilder()
                .setCustomId(`message_edit_modal__${message.id}_${interaction.channel!.id}`)
                .setTitle("Edit Thread Message")
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('content')
                                .setLabel('Updated Content')
                                .setRequired(true)
                                .setStyle(TextInputStyle.Paragraph)
                                .setValue(message.embeds[0].description ?? ''),
                        )
                );

            await interaction.showModal(modal);
            
            interaction.awaitModalSubmit({
                time: 10 * 60 * 1000,
                dispose: true,
                filter(i) {
                    return i.member?.user.id === interaction.member?.user.id && i.channel?.id === interaction.channel?.id && i.customId === `message_edit_modal__${message.id}_${interaction.channel!.id}`;
                }
            })
            .then(async interaction => {
                try {
                    const result = await updateReply(client, thread, id, {
                        content: interaction.fields.getTextInputValue('content'),
                        author: interaction.member!.user as User
                    });

                    if (!result) {
                        throw new Error();
                    }

                    await interaction.reply({
                        content: "Message updated successfully!",
                        ephemeral: true
                    });
                }
                catch (e) {
                    console.log(e);
                    await interaction.reply({
                        content: "Error occurred while trying to update the message.",
                        ephemeral: true
                    });
                }
            })
            .catch(console.error)
        }
        catch (e) {
            await interaction.reply({
                content: "Message not available. Make sure you're performing this operation on a sent message, not edited message!",
                ephemeral: true
            });

            return;
        }
    }
}
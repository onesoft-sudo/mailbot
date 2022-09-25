/**
* This file is part of MailBot.
* 
* Copyright (C) 2021-2022 OSN Inc.
*
* MailBot is free software; you can redistribute it and/or modify it
* under the terms of the GNU Affero General Public License as published by 
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* 
* MailBot is distributed in the hope that it will be useful, but
* WITHOUT ANY WARRANTY; without even the implied warranty of 
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License 
* along with MailBot. If not, see <https://www.gnu.org/licenses/>.
*/

import { ChannelType, Interaction } from "discord.js";
import DiscordClient from "../../client/Client";
import BaseEvent from "../../utils/structures/BaseEvent";

export default class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super('interactionCreate');
    }

    async run(client: DiscordClient, interaction: Interaction): Promise<void> {
        if (!interaction.guild || interaction.channel?.type === ChannelType.DM) {
            if (interaction.isRepliable()) {
                await interaction.reply({
                    content: "You cannot use slash commands of this bot on DMs.",
                    ephemeral: true
                });
            }

            return;
        }

        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            const { commandName } = interaction;
            const command = client.commands.get(commandName);

            if (command && command.interactions && (interaction.isChatInputCommand() || (command.userContextMenu && interaction.isUserContextMenuCommand()) || (command.messageContextMenu && interaction.isMessageContextMenuCommand()))) {
                await command.execute(client, interaction);
            }
        }
    }
}
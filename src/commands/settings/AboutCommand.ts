import { Message, CommandInteraction, CacheType, EmbedBuilder } from "discord.js";
import Client from "../../client/Client";
import CommandOptions from "../../types/CommandOptions";
import BaseCommand from "../../utils/structures/BaseCommand";

export default class AboutCommand extends BaseCommand {
    metadata = require('../../../package.json');
    
    constructor() {
        super('about', 'settings', ['info', 'botinfo']);
    }

    async run(client: Client, message: Message<boolean> | CommandInteraction<CacheType>, options?: CommandOptions | undefined): Promise<void> {
        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ iconURL: client.user?.displayAvatarURL(), name: "MailBot" })
                    .setDescription(`
                        A free and open source Discord Bot for contacting server staff, specially created for **The Everything Server**.
                        Copyright (C) ${new Date().getFullYear()} OSN Inc.
                        This bot comes with ABSOLUTELY NO WARRANTY.
                        This is free software, and you are welcome to redistribute it under certain conditions.
                        See the [GNU Affero General Public License v3](https://www.gnu.org/licenses/agpl-3.0.en.html) for more detailed information.
                    `)
                    .addFields({
                        name: 'Version',
                        value: this.metadata.version,
                        inline: true
                    }, {
                        name: 'Source Code',
                        value: `[GitHub](${this.metadata.repository.url})`,
                        inline: true,
                    }, {
                        name: 'Licensed Under',
                        value: `[GNU Affero General Public License v3](https://www.gnu.org/licenses/agpl-3.0.en.html)`,
                        inline: true
                    })
                    .addFields({
                        name: "Author",
                        value: `[${this.metadata.author.name}](${this.metadata.author.url})`,
                        inline: true
                    }, {
                        name: 'Support',
                        value: this.metadata.author.email,
                        inline: true
                    })
                    .setFooter({
                        text: `Copyright © OSN Inc 2022. All rights reserved.`
                    })
            ]
        });
    }
}
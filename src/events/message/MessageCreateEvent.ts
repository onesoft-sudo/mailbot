import BaseEvent from '../../utils/structures/BaseEvent';
import { ChannelType, Message } from 'discord.js';
import DiscordClient from '../../client/Client';

export default class MessageCreateEvent extends BaseEvent {
    constructor() {
        super('messageCreate');
    }

    async run(client: DiscordClient, message: Message) {
        if (message.author.bot) 
            return;

        if (message.channel.type === ChannelType.DM || !message.guild) {
            client.emit('dmCreate', message);
            return;
        }
        
        if (message.content.startsWith(client.config.prefix)) {
            const rawArgv = message.content
                .slice(client.prefix.length)
                .trim()
                .split(/ +/);
            const [cmdName, ...cmdArgs] = rawArgv;

            const command = client.commands.get(cmdName);
            
            if (command) {
                const options: { [key: string]: string } = {};
                const args: string[] = [];

                let i = 0;

                for await (let a of cmdArgs) {
                    if (!a.startsWith('-')) {
                        if (typeof options[a] === 'undefined') {
                            args.push(a);
                        }

                        i++;

                        continue;
                    }

                    options[a] = cmdArgs[i + 1] ?? true;
                    i++;
                }

                command.execute(client, message, {
                    rawArgv,
                    rawArgs: cmdArgs,
                    args,
                    options,
                });
            }
        }
    }
}
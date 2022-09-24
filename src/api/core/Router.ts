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

import { Collection } from "discord.js";
import fs from "fs/promises";
import path from "path";
import DiscordClient from "../../client/Client";
import { HTTPMethods } from "../../types/HTTPMethods";
import Controller from "../../utils/structures/Controller";
import Server from "./Server";
import { Router as ExpressRouter } from 'express';
import GlobalMiddleware from "../middleware/GlobalMiddleware";

export type RouterMap = {
    [key in HTTPMethods]: Collection<string, [Controller, string]>;
};

export default class Router {
    routes: RouterMap = {
        GET: new Collection(),
        POST: new Collection(),
        PUT: new Collection(),
        PATCH: new Collection(),
        DELETE: new Collection(),
    };

    globalMiddleware = [ GlobalMiddleware ];

    controllers: Controller[] = [];
    expressRouter: ExpressRouter = ExpressRouter();

    constructor(protected client: DiscordClient, protected server: Server) {
        this.expressRouter.options('*', ...this.globalMiddleware, (req, res) => {
            res.status(200).send(undefined);
        });
    }

    public async loadRoutesFromController(filePath: string) {
        const { default: Controller } = await import(filePath);
        const controller = new Controller(this.client);
        this.controllers.push(controller);
    }

    public async loadRoutes(directory: string) {
        const files = await fs.readdir(directory);
        
        for (const file of files) {
            const stat = await fs.lstat(path.join(directory, file));
    
            if (stat.isDirectory())
                this.loadRoutes(path.join(directory, file));
    
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                await this.loadRoutesFromController(path.join(directory, file));
            }
        }
    }
}
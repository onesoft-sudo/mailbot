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

import express from 'express';
import path from 'path';
import DiscordClient from '../../client/Client';
import Router from './Router';

export default class Server {
    router: Router;
    server: express.Application;

    constructor(protected client: DiscordClient) {
        this.router = new Router(client, this);
        this.router.loadRoutes(path.resolve(__dirname, '..', 'controllers')).then(() => console.log("Routes loaded")).catch(console.error);
        this.server = express();
    }

    run() {
        this.server.use(express.json(), express.urlencoded({ extended: true }));
        this.server.use(this.router.expressRouter);

        this.server.listen(process.env.PORT, () => {
            console.log('Server listening at port ' + process.env.PORT);
        });
    }
}
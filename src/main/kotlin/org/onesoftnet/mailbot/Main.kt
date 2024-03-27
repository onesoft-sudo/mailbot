package org.onesoftnet.mailbot

import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.core.applicationScope

fun main() {
    runBlocking {
        launch {
            val application = Application.create()
            application.boot()
            application.run()
        }
    }

    applicationScope.cancel()
}
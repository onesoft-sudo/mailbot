package org.onesoftnet.mailbot.core

import org.ktorm.dsl.AssignmentsBuilder
import org.ktorm.dsl.insert
import org.onesoftnet.mailbot.tables.Mails

abstract class AbstractService(protected val application: Application) {
    open fun boot() {}
}
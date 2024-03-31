package org.onesoftnet.mailbot.core

import com.google.common.reflect.ClassPath
import dev.kord.core.event.Event
import org.slf4j.LoggerFactory
import kotlin.reflect.KClass
import kotlin.reflect.full.primaryConstructor

class DynamicLoader(private val application: Application) {
    private val EVENTS_PACKAGE = "org.onesoftnet.mailbot.events"
    private val SERVICES_PACKAGE = "org.onesoftnet.mailbot.services"
    private val COMMANDS_PACKAGE = "org.onesoftnet.mailbot.commands"

    private val logger = LoggerFactory.getLogger(this.javaClass)

    private fun <T : Any> loadClassesInPackage(packageName: String): List<KClass<T>>? {
        return loadClassesInPackage(packageName, null)
    }

    private fun <T : Any> loadClassesInPackage(packageName: String, forEach: (() -> Boolean)?): List<KClass<T>>? {
        val classLoader = ClassLoader.getSystemClassLoader()
        return ClassPath.from(classLoader)
            .allClasses
            .filter {
                it.packageName.startsWith(packageName) &&
                !it.name.contains('$')
            }
            .map {
                val clazz = it.load().kotlin

                if (forEach?.invoke() == false) {
                    return null
                }

                @Suppress("UNCHECKED_CAST")
                clazz as KClass<T>
            }
    }

     fun loadEvents() {
         val eventClasses = loadClassesInPackage<EventListener<Event>>(EVENTS_PACKAGE)

         eventClasses?.forEach {
             val instance = it.primaryConstructor?.call(application) ?: return@forEach
             logger.info("Loading event: ${it.simpleName}")
             instance.boot()
             instance.register(application)
        }
    }

     fun loadCommands() {
         val commandClasses = loadClassesInPackage<Command>(COMMANDS_PACKAGE)

         commandClasses?.forEach {
             val instance = it.primaryConstructor?.call(application) ?: return@forEach
             logger.info("Loading command: ${it.simpleName}")
             application.addCommand(instance)
        }
    }

    fun loadServices() {
        val serviceClasses = loadClassesInPackage<AbstractService>(SERVICES_PACKAGE)

        serviceClasses?.forEach {
            val instance = it.primaryConstructor?.call(application) ?: return@forEach
            logger.info("Loading service: ${it.simpleName}")
            instance.boot()
            application.registerService(instance)
        }
    }
}
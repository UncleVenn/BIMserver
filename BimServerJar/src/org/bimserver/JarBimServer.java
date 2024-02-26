package org.bimserver;

/******************************************************************************
 * Copyright (C) 2009-2019  BIMserver.org
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see {@literal<http://www.gnu.org/licenses/>}.
 *****************************************************************************/

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.*;

/******************************************************************************
 * Copyright (C) 2009-2017  BIMserver.org
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see {@literal<http://www.gnu.org/licenses/>}.
 *****************************************************************************/

import org.apache.commons.io.IOUtils;
import org.bimserver.database.DatabaseSession;
import org.bimserver.database.OperationType;
import org.bimserver.database.actions.InstallPluginBundleFromBytes;
import org.bimserver.resources.JarResourceFetcher;
import org.bimserver.shared.exceptions.PluginException;
import org.bimserver.shared.exceptions.UserException;
import org.bimserver.shared.interfaces.PluginInterface;
import org.bimserver.webservices.impl.PluginServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;

public class JarBimServer {
    private static final Logger LOGGER = LoggerFactory.getLogger(JarBimServer.class);
    private BimServer bimServer;

    public static void main(String[] args) {
        String address = "192.168.0.38";
        String port = "8082";
        String homedir = "./home";
        for (String arg : args) {
            if (arg.startsWith("address=")) {
                address = arg.substring(8);
                if (address.startsWith("\"") && address.endsWith("\"")) {
                    address = address.substring(1, address.length() - 1);
                }
            } else if (arg.startsWith("port=")) {
                port = arg.substring(5);
                if (port.startsWith("\"") && port.endsWith("\"")) {
                    port = port.substring(1, port.length() - 1);
                }
            } else if (arg.startsWith("homedir=")) {
                homedir = arg.substring(8);
                if (homedir.startsWith("\"") && homedir.endsWith("\"")) {
                    homedir = homedir.substring(1, homedir.length() - 1);
                }
            }
        }
        final JarBimServer server = new JarBimServer();
        server.start(address, Integer.parseInt(port), homedir, "www");
    }

    public void stop() {
        LOGGER.info("Stopping server...");
        try {
            bimServer.stop();
        } catch (Exception e) {
            LOGGER.error("", e);
        }
        LOGGER.info("Server stopped successfully");
    }

    /**
     * Add a file appender to every logger we can find (the loggers should already have been configured via logback.xml)
     *
     * @throws IOException
     */
    private void fixLogging(BimServerConfig config) throws IOException {
        Path logFolder = config.getHomeDir().resolve("logs");
        if (!Files.isDirectory(logFolder)) {
            Files.createDirectories(logFolder);
        }
        Path file = logFolder.resolve("bimserver.log");

        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        PatternLayoutEncoder ple = new PatternLayoutEncoder();

        ple.setPattern("%date %level [%thread] %logger{10} [%file:%line] %msg%n");
        ple.setContext(lc);
        ple.start();
        FileAppender<ILoggingEvent> fileAppender = new FileAppender<ILoggingEvent>();
        String filename = file.toAbsolutePath().toString();

        if (lc instanceof LoggerContext) {
            if (!lc.isStarted()) {
                lc.start();
            }
        }

        System.out.println("Logging to " + filename);

        fileAppender.setFile(filename);
        fileAppender.setEncoder(ple);
        fileAppender.setContext(lc);
        fileAppender.start();

        for (ch.qos.logback.classic.Logger log : lc.getLoggerList()) {
            if (log.getLevel() != null) {
                log.addAppender(fileAppender);
            }
        }
    }

    public void start(String address, int port, String homedir, String resourceBase) {
        // Strange hack needed for OSX
        if (homedir.startsWith("\"") && homedir.endsWith("\"")) {
            homedir = homedir.substring(1, homedir.length() - 2);
        }
        System.setProperty("org.apache.cxf.Logger", "org.apache.cxf.common.logging.Slf4jLogger");
        BimServerConfig bimServerConfig = new BimServerConfig();
        bimServerConfig.setHomeDir(Paths.get(homedir));

        bimServerConfig.setResourceFetcher(new JarResourceFetcher(Paths.get("home"), Paths.get("config"), Paths.get(".")));
        bimServerConfig.setStartEmbeddedWebServer(true);
        bimServerConfig.setEnvironment(Environment.JAR);
        bimServerConfig.setPort(port);
        bimServerConfig.setClassPath(System.getProperty("java.class.path"));
        bimServer = new BimServer(bimServerConfig);

        try {
            fixLogging(bimServerConfig);
        } catch (IOException e1) {
            e1.printStackTrace();
        }
        DatabaseSession session = null;
        try {
            LOGGER.debug("Setting resourcebase to www");
            EmbeddedWebServer embeddedWebServer = new EmbeddedWebServer(bimServer, bimServerConfig.getResourcebase(), bimServerConfig.isLocalDev());
            embeddedWebServer.setResourceBase(homedir + "/" + resourceBase);
            bimServer.setEmbeddedWebServer(embeddedWebServer);
            bimServer.start();
            LOGGER.info("Server started successfully");
            LOGGER.info("install plugins");
            session = bimServer.getDatabase().createSession(OperationType.POSSIBLY_WRITE);
            PluginServiceImpl service = (PluginServiceImpl) bimServer.getService(PluginInterface.class);
            File file = new File(homedir + "/install_plugins");
            if (file.exists() && file.isDirectory()) {
                File[] plugins = file.listFiles();
                for (File plugin : plugins) {
                    ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                    IOUtils.copy(new FileInputStream(plugin), byteArrayOutputStream);
                    try {
                        session.executeAndCommitAction(new InstallPluginBundleFromBytes(session, service.getInternalAccessMethod(), bimServer, byteArrayOutputStream.toByteArray(), true, true));
                    } catch (Exception e) {
                        LOGGER.info(e.getMessage());
                    } finally {
                        file.delete();
                    }
                }
            }
        } catch (Exception e) {
            if (e instanceof PluginException || e instanceof UserException) {
                LOGGER.info(e.getMessage());
            } else {
                LOGGER.error("", e);
            }
        } finally {
            if (session != null)
                session.close();
        }
    }
}
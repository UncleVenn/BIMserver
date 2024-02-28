package org.bimserver.starter;

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

import org.bimserver.JarBimServer;

import java.awt.BorderLayout;
import java.awt.Desktop;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URL;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.jar.Attributes;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.jar.Manifest;

import javax.imageio.ImageIO;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SpringLayout;
import javax.swing.UIManager;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;

public class Starter {
    private Process exec;
    public static void main(String[] args) {
        Starter starter = new Starter();
//        starter.start();
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
        File file = starter.expand();
        starter.start(file, address, port, "8475m", "1024k", "default", homedir);
    }

    private void start(File destDir, String address, String port, String heapsize, String stacksize, String jvmPath, String homedir) {
        try {
            String os = System.getProperty("os.name");
            boolean isMac = os.toLowerCase().contains("mac");
            System.out.println("OS: " + os);
//			String command = "";

            checkJavaVersion(jvmPath);

            List<String> commands = new ArrayList<>();

            if (jvmPath.equalsIgnoreCase("default")) {
                commands.add("java");
            } else {
                File jvm = new File(jvmPath);
                if (jvm.exists()) {
                    File jre = new File(jvm, "jre");
                    if (!jre.exists()) {
                        jre = jvm;
                    }
                    commands.add(new File(jre, "bin" + File.separator + "java").getAbsolutePath());
                    File jreLib = new File(jre, "lib");

                    System.out.println("Using " + jreLib.getAbsolutePath() + " for bootclasspath");

                    String xbcp = "-Xbootclasspath ";
                    for (File file : jreLib.listFiles()) {
                        if (file.getName().endsWith(".jar")) {
                            if (file.getAbsolutePath().contains(" ")) {
                                xbcp += "\"" + file.getAbsolutePath() + "\"" + File.pathSeparator;
                            } else {
                                xbcp += file.getAbsolutePath() + File.pathSeparator;
                            }
                        }
                    }
                    if (jre != jvm) {
                        File toolsFile = new File(jvm, "lib" + File.separator + "tools.jar");
                        if (toolsFile.getAbsolutePath().contains(" ")) {
                            xbcp += "\"" + toolsFile.getAbsolutePath() + "\"";
                        } else {
                            xbcp += toolsFile.getAbsolutePath();
                        }
                    }
                    commands.add(xbcp);
                } else {
                    System.out.println("Not using selected JVM (directory not found), using default JVM");
                }
            }
            commands.add("-Xmx" + heapsize);
            commands.add("-Xss" + stacksize);
//			boolean debug = true;
//			if (debug ) {
//				command += " -Xdebug -Xrunjdwp:transport=dt_socket,address=8998,server=y";
//			}
//
//            if (useProxy.isSelected()) {
//                commands.add("-Dhttp.proxyHost=" + proxyHost.getText());
//                commands.add("-Dhttp.proxyPort=" + proxyPort.getText());
//                commands.add("-Dhttps.proxyHost=" + proxyHost.getText());
//                commands.add("-Dhttps.proxyPort=" + proxyPort.getText());
//            }

            String cp = "." + File.pathSeparator;
            boolean escapeCompletePath = isMac;
//			if (escapeCompletePath) {
//				// OSX fucks up with single jar files escaped, so we try to escape the whole thing
//				command += "\"";
//			}
            cp += "lib" + File.pathSeparator;
            File dir = new File(destDir + File.separator + "lib");
            for (File lib : dir.listFiles()) {
                if (lib.isFile()) {
                    if (lib.getName().contains(" ") && !escapeCompletePath) {
                        cp += "\"lib" + File.separator + lib.getName() + "\"" + File.pathSeparator;
                    } else {
                        cp += "lib" + File.separator + lib.getName() + File.pathSeparator;
                    }
                }
            }
            if (cp.endsWith(File.pathSeparator)) {
                cp = cp.substring(0, cp.length() - 1);
            }
            commands.add("-Dorg.apache.cxf.Logger=org.apache.cxf.common.logging.Slf4jLogger");
            commands.add("-classpath");
            commands.add(cp);
//			if (escapeCompletePath) {
//				// OSX fucks up with single jar files escaped, so we try to escape the whole thing
//				command += "\"";
//			}
            Enumeration<URL> resources = getClass().getClassLoader().getResources("META-INF/MANIFEST.MF");
            String realMainClass = "";
            while (resources.hasMoreElements()) {
                URL url = resources.nextElement();
                Manifest manifest = new Manifest(url.openStream());
                Attributes mainAttributes = manifest.getMainAttributes();
                for (Object key : mainAttributes.keySet()) {
                    if (key.toString().equals("Real-Main-Class")) {
                        realMainClass = mainAttributes.get(key).toString();
                        break;
                    }
                }
            }
            System.out.println("Main class: " + realMainClass);
            commands.add(realMainClass);
            commands.add("address=" + address);
            commands.add("port=" + port);
            commands.add("homedir=" + homedir);

            System.out.println("\nCommands:");
            for (String command : commands) {
                System.out.println(command);
            }
            ProcessBuilder processBuilder = new ProcessBuilder(commands);
            processBuilder.directory(destDir);

//			System.out.println("Running: " + command);
            exec = processBuilder.start();
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                if (exec != null) {
                    exec.destroy();
                    exec = null;
                }
            }, "Thutdown Hook"));
//			exec = Runtime.getRuntime().exec(command, null, destDir);

            new Thread(() -> {
                BufferedInputStream inputStream = new BufferedInputStream(exec.getInputStream());
                byte[] buffer = new byte[1024];
                int red;
                try {
                    red = inputStream.read(buffer);
                    while (red != -1) {
                        String s = new String(buffer, 0, red);
                        System.out.print(s);
                        red = inputStream.read(buffer);
                    }
                } catch (IOException e) {
                }
            }, "Sysin reader").start();
            new Thread(() -> {
                BufferedInputStream errorStream = new BufferedInputStream(exec.getErrorStream());
                byte[] buffer = new byte[1024];
                int red;
                try {
                    red = errorStream.read(buffer);
                    while (red != -1) {
                        String s = new String(buffer, 0, red);
                        System.out.print(s);
                        red = errorStream.read(buffer);
                    }
                } catch (IOException e) {
                }
            }, "Syserr reader").start();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void checkJavaVersion(String jvmPath) {
        List<String> commands = new ArrayList<>();
        if (jvmPath.equalsIgnoreCase("default")) {
            commands.add("java");
        } else {
            File jvm = new File(jvmPath);
            if (jvm.exists()) {
                File jre = new File(jvm, "jre");
                if (!jre.exists()) {
                    jre = jvm;
                }
                commands.add(new File(jre, "bin" + File.separator + "java").getAbsolutePath());
                File jreLib = new File(jre, "lib");

                System.out.println("Using " + jreLib.getAbsolutePath() + " for bootclasspath");

                String xbcp = "-Xbootclasspath:";
                for (File file : jreLib.listFiles()) {
                    if (file.getName().endsWith(".jar")) {
                        if (file.getAbsolutePath().contains(" ")) {
                            xbcp += "\"" + file.getAbsolutePath() + "\"" + File.pathSeparator;
                        } else {
                            xbcp += file.getAbsolutePath() + File.pathSeparator;
                        }
                    }
                }
                if (jre != jvm) {
                    File toolsFile = new File(jvm, "lib" + File.separator + "tools.jar");
                    if (toolsFile.getAbsolutePath().contains(" ")) {
                        xbcp += "\"" + toolsFile.getAbsolutePath() + "\"";
                    } else {
                        xbcp += toolsFile.getAbsolutePath();
                    }
                }
                commands.add(xbcp);
            } else {
                System.out.println("Not using selected JVM (directory not found), using default JVM");
            }
        }

        commands.add("-version");

        ProcessBuilder processBuilder = new ProcessBuilder(commands);
        try {
            exec = processBuilder.start();
            new Thread(new Runnable() {
                @Override
                public void run() {
                    BufferedInputStream inputStream = new BufferedInputStream(exec.getInputStream());
                    byte[] buffer = new byte[1024];
                    int red;
                    try {
                        red = inputStream.read(buffer);
                        while (red != -1) {
                            String s = new String(buffer, 0, red);
                            System.out.print(s);
                            red = inputStream.read(buffer);
                        }
                    } catch (IOException e) {
                    }
                }
            }, "Sysin reader").start();
            new Thread(new Runnable() {
                @Override
                public void run() {
                    BufferedInputStream errorStream = new BufferedInputStream(exec.getErrorStream());
                    byte[] buffer = new byte[1024];
                    int red;
                    try {
                        red = errorStream.read(buffer);
                        while (red != -1) {
                            String s = new String(buffer, 0, red);
                            System.out.print(s);
                            red = errorStream.read(buffer);
                        }
                    } catch (IOException e) {
                    }
                }
            }, "Syserr reader").start();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private File expand() {
        JarFile jar = null;
        String jarFileName = getJarFileNameNew();
        File destDir = new File(jarFileName.substring(0, jarFileName.indexOf(".jar")));
        if (!destDir.isDirectory()) {
            System.out.println("Expanding " + jarFileName);
            try {
                jar = new java.util.jar.JarFile(jarFileName);
                Enumeration<JarEntry> enumr = jar.entries();
                while (enumr.hasMoreElements()) {
                    JarEntry file = enumr.nextElement();
                    System.out.println(file.getName());
                    File f = new File(destDir, file.getName());
                    if (file.isDirectory()) {
                        if (!f.getParentFile().exists()) {
                            f.getParentFile().mkdir();
                        }
                        f.mkdir();
                        continue;
                    }
                    InputStream is = jar.getInputStream(file);
                    FileOutputStream fos = new FileOutputStream(f);
                    byte[] buffer = new byte[1024];
                    int red = is.read(buffer);
                    while (red != -1) {
                        fos.write(buffer, 0, red);
                        red = is.read(buffer);
                    }
                    fos.close();
                    is.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                try {
                    if (jar != null) {
                        jar.close();
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        } else {
            System.out.println("No expanding necessary");
        }
        return destDir;
    }

    private String getJarFileNameNew() {
        String name = this.getClass().getName().replace(".", "/") + ".class";
        URL urlJar = getClass().getClassLoader().getResource(name);
        String urlString = urlJar.getFile();
        urlString = urlString.substring(urlString.indexOf(":") + 1, urlString.indexOf("!"));
        try {
            return URLDecoder.decode(urlString, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return null;
    }
}
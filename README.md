# romxz.github.io

##Introduction

Our code creates a 3D render of a human bust which can be controlled using serial data (from Arduino) and a graphical user interface control panel. Features include: zoom in/out, lighting control, camera control. 

##Definitions

•	Serial Communication and Serial Ports

Serial communication refers to the transportation process in which data is transferred one bit at a time sequentially. Serial ports are interfaces that allow for data transfer through serial communication, and have many important usages today in the fields of automation, scientific instrumentation, and commercial product development.

•	Arduino

Arduinos are microcontroller boards that have the ability to read digital/analog data, write digital/analog data, and communicate with a computer using serial communication with its serial port, among other functions. 

•	HTTP/Request/Response/GET

HTTP(Hypertext Transfer Protocol) allows for communication and data transfer between clients and servers. This communication occurs via a request-response protocol between a client and a server. GET is one system of this request-response protocol that requests data from the specified resource. 

•	Node.js/ Express.js

Node.js is a runtime-environment for server-side Web applications. Most modules are developed in the Javascript language, and events are run in asynchronous I/O.  Express.js is a web framework application for Node.js that is the general standard for developing server-based applications. 

•	Localhost

Localhost is the standard hostname that is assigned to the computational device in use (always with IP address 127.0.0.1. )

##File Explanations

####index.js

•	Initializes communication with the serial port and opens up a server. 

•	Gets an analog reading from the serial port and writes it to a client.


####public/index.html

•	Renders a 3D model that can be controlled using serial data. 

•	Imports the relevant JS modules and CSS styling used in the webpage.

•	Runs a script to make a looping request to the server. 

•	Makes a call to src/mesh_import_woman2.


####public/src/mesh_import_woman2.js

•	On startup, a woman’s 3D mesh is loaded, and the initial render, draw conditions (camera/light), and GUI control panel are enabled in the init() function. 

•	The render() function is looped that constantly collects serial data through making requests to the server, which is used to alter the orientation of the shapes on the webpage. 


##Requirements

	- Arduino Software
	- Node.js
	- Web Browser
    
##Instructions

1.	Upload Arduino code that prints to serial. 
2.	Change constants in public/index.html (delimiters, axes, etc. depending on your Arduino code)
3.	Run index.js (through node.js), by typing “node index.js portname” in the command line. 
4.	Open your browser to the webpage “localhost:8080/index.html” to visualize the code at public/index.html.

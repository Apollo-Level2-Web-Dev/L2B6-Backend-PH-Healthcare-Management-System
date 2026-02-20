import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seed";

let server : Server;
const bootstrap = async() => {
    try {
        await seedSuperAdmin();
        server = app.listen(envVars.PORT, () => {
            console.log(`Server is running on http://localhost:${envVars.PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }   
}

// SIGTERM signal handler
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received. Shutting down server...");

    if(server){
        server.close(() => {
            console.log("Server closed gracefully.");
            process.exit(1);
        });
    } 
    
    process.exit(1);
    
})

// SIGINT signal handler

process.on("SIGINT", () => {
    console.log("SIGINT signal received. Shutting down server...");

    if(server){
        server.close(() => {
            console.log("Server closed gracefully.");
            process.exit(1);
        });

    }

    process.exit(1);
});

//uncaught exception handler
process.on('uncaughtException', (error) => {
    console.log("Uncaught Exception Detected... Shutting down server", error);

    if(server){
        server.close(() => {
            process.exit(1);
        })
    }

    process.exit(1);
})

process.on("unhandledRejection", (error) => {
    console.log("Unhandled Rejection Detected... Shutting down server", error);

    if(server){
        server.close(() => {
            process.exit(1);
        })
    }

    process.exit(1);
})

//unhandled rejection handler

bootstrap();
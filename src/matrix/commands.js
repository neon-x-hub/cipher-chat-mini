export class MatrixCommands {
    constructor(client) {
      this.client = client;
    }

    /*
    ==================================================================
    Auth Management Commands
    ==================================================================
    */

    async login(strategy, credentials) {
        const client = this.client;
        try {
            const { access_token, user_id, device_id } = await client.login(strategy, credentials);
            console.log("\n✅ Login successful!");
            console.log("User ID:", user_id);
            console.log("Access Token:", access_token);
            client.setAccessToken(access_token);
            return { access_token, user_id, device_id };
        } catch (error) {
            console.error("\n❌ Login failed:", error.message);
            process.exit(1);
        }
    }



    /*
    ==================================================================
    Room Management Commands
    ==================================================================
    */

    async listRooms() {
     return await this.client.getRooms();
    }


}

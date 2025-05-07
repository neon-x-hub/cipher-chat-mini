import { clientProxy } from "../../matrix/client.mjs";

async function inviteUser(params) {
    const client = clientProxy;
    try {
        // Invite the user to the room - this returns a Room object
        const room = await client.inviteUser(params);

        return room;

    } catch (error) {
        // Handle specific Matrix errors
        if (error.errcode === 'M_FORBIDDEN') {
            throw new Error('You do not have permission to invite this user');
        }
        if (error.errcode === 'M_NOT_FOUND') {
            throw new Error('User not found - check the ID/alias');
        }
        throw new Error(`Invite failed: ${error.message}`);

    }


}

export { inviteUser };

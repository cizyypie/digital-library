import amqp from 'amqplib'

let channel: amqp.Channel | null = null

export const getChannel = async () => {
    if (!channel) {
        const connection = await amqp.connect(process.env.CLOUDAMQP_URL!)
        channel = await connection.createChannel()
    }
    return channel
}
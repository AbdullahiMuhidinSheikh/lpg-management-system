const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log('Testing connection to Supabase...')
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    try {
        await prisma.$connect()
        console.log('SUCCESS: Connected to database!')

        // Try a simple query
        const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`
        console.log('Database info:', result)

        await prisma.$disconnect()
        console.log('Disconnected cleanly.')
    } catch (error) {
        console.error('FAILED:', error.message)
        if (error.meta) console.error('Meta:', error.meta)
        await prisma.$disconnect()
        process.exit(1)
    }
}

main()

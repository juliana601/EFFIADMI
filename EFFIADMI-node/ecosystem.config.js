module.exports = {
    apps: [
        {
            name: 'effiadmi-node',
            script: 'index.js',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            time: true,
        },
    ],
};
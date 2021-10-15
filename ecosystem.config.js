module.exports = {
  apps: [{
    name: 'convibra_api',
    script: 'app.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  },
  {
    name: 'convibra_certificate_creator',
    script: 'node queue-processor.js certificate-creator.job 1',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'contract-deployment.job 1',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  },
  {
    name: 'convibra_certificate_convertor',
    script: 'node queue-processor.js certificate-convertor.job 1',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'contract-deployment.job 1',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  },
  {
    name: 'convibra_recipient_importer',
    script: 'node queue-processor.js recipient-importer.job 1',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'contract-deployment.job 1',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  },
  {
    name: 'convibra_certificate_revocation',
    script: 'node queue-processor.js certificate-revocation.job 1',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'contract-deployment.job 1',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  },
  {
    name: 'convibra_certificate_issuer',
    script: 'node queue-processor.js certificate-issuer.job 1',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'contract-deployment.job 1',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  },
  {
    name: 'convibra_issue_certificate_on_blockchain',
    script: 'node queue-processor.js issue-certificate-on-blockchain.job 1',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'contract-deployment.job 1',
    instances: 3,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    env_staging: {
      NODE_ENV: 'staging'
    }
  }],

  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/master',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

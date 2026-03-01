const fs = require('fs');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    fs.writeFileSync('error.json', JSON.stringify({ status: 'success' }));
    process.exit(0);
  } catch (e) {
    fs.writeFileSync(
      'error.json',
      JSON.stringify({ message: e.message, stack: e.stack }, null, 2),
      'utf8'
    );
    process.exit(1);
  }
}

bootstrap();

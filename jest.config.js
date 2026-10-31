// Desactiva el envio de estadisticas anonimas de Pact
process.env.PACT_DO_NOT_TRACK = 'true';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
};

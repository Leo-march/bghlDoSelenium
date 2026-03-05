import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL: string = 'http://localhost:8100/tabs/dashboard';
const PAUSA: number = 800;
const TIMEOUT: number = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function pausarServerTest(): Promise<void> {
  const options = new chrome.Options();
  options.addArguments('--window-size=390,844');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');

  const driver: WebDriver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.css('.custom-header')), TIMEOUT);
    await sleep(PAUSA);

    // Clica em Pausar
    const btnPausar = await driver.wait(
      until.elementLocated(By.xpath("//ion-button[contains(., 'Pausar')]")),
      TIMEOUT
    );
    await btnPausar.click();
    await sleep(PAUSA);

    // Verifica que pausou
    await driver.wait(
      until.elementLocated(By.xpath("//ion-button[contains(., 'Iniciar')]")),
      TIMEOUT
    );
    const status = await driver.findElement(By.css('.status-info h3'));
    const textoStatus: string = await status.getText();
    if (!textoStatus.includes('Pausada')) throw new Error('Status deveria ser Pausada');
    console.log('✅ Servidor pausado com sucesso');

    // Clica em Iniciar para retomar
    const btnIniciar = await driver.findElement(
      By.xpath("//ion-button[contains(., 'Iniciar')]")
    );
    await btnIniciar.click();
    await sleep(PAUSA);

    // Verifica que retomou
    const statusRetomado = await driver.findElement(By.css('.status-info h3'));
    const textoRetomado: string = await statusRetomado.getText();
    if (!textoRetomado.includes('Automática')) throw new Error('Status deveria ser Automática');
    console.log('✅ Servidor retomado com sucesso');

  } catch (err: any) {
    console.error('❌ Teste falhou:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();
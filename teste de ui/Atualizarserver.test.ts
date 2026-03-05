import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL: string = 'http://localhost:8100/tabs/dashboard';
const PAUSA: number = 800;
const TIMEOUT: number = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function atualizarServerTest(): Promise<void> {
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

    // Clica no botão Atualizar
    const btn: WebElement = await driver.wait(
      until.elementLocated(By.xpath("//ion-button[contains(., 'Atualizar')]")),
      TIMEOUT
    );
    await btn.click();
    await sleep(200);

    // Verifica que o carregamento foi disparado
    const estaDisabled: string | null = await btn.getAttribute('disabled');
    const texto: string = await btn.getText();
    if (estaDisabled !== 'true' && !texto.includes('Atualizando')) {
      throw new Error("Botão deveria estar desabilitado ou mostrar 'Atualizando...'");
    }
    console.log('✅ Atualização da tela disparada com sucesso');

    // Aguarda voltar ao estado normal
    await driver.wait(
      until.elementLocated(By.xpath("//ion-button[contains(., 'Atualizar')]")),
      TIMEOUT
    );
    console.log('✅ Tela atualizada e botão liberado');

  } catch (err: any) {
    console.error('❌ Teste falhou:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL: string = 'http://localhost:8100/tabs/dashboard';
const PAUSA: number = 800;
const TIMEOUT: number = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scroll(driver: WebDriver, px: number): Promise<void> {
  await driver.executeScript(`
    document.querySelector('ion-content').shadowRoot
      .querySelector('.inner-scroll').scrollTop += ${px};
  `);
  await sleep(PAUSA);
}

(async function scrollTelaTest(): Promise<void> {
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

    // Confirma que está no topo
    const header = await driver.findElement(By.css('.custom-header h1'));
    const headerVisivel: boolean = await header.isDisplayed();
    if (!headerVisivel) throw new Error('Header deveria estar visível no topo');
    console.log('✅ Início no topo da tela');

    // Scrolla em 3 passos
    await scroll(driver, 300);
    await scroll(driver, 300);
    await scroll(driver, 300);

    // Verifica que a seção de registros anteriores apareceu
    const secao = await driver.wait(
      until.elementLocated(By.css('.outros-registros-container')),
      TIMEOUT
    );
    const secaoVisivel: boolean = await secao.isDisplayed();
    if (!secaoVisivel) throw new Error('Seção de registros anteriores deveria estar visível');
    console.log('✅ Scroll revelou a seção de Registros Anteriores');

  } catch (err: any) {
    console.error('❌ Teste falhou:', err.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();
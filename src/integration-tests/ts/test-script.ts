import * as webdriver from 'selenium-webdriver';

const By = webdriver.By,
      until = webdriver.until;

export function test(driver, base): Promise<void> {
    driver.get(`${base}/script.html`);
    return driver.findElement(By.id('output')).then(output => {
        return driver.wait(until.elementIsVisible(output), 10000).then(() => {
            return output.getText().then(text => {
                if (text === "BLOCKED") {
                    return Promise.resolve();
                } else {
                    const msg = "script.html: script should not have loaded";
                    return Promise.reject(msg);
                }
            });
        });
    });
}

export const name = "test-script";
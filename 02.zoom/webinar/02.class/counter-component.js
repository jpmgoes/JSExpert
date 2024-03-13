// IIFI -> server para encapsular as variaveis,
// impedindo assim conflitos com meio externo como libs,
// ou user tentando mexer no console do navegador
(() => {
  const COUNTER_VALUE = 10;
  const COUNTER_ID = "counter";

  class CounterComponent {
    constructor() {
      this.init();
    }

    get counterProxy() {
      const counter = new Proxy(
        {
          value: COUNTER_VALUE,
          stop: () => {},
        },
        {
          set: (counter, propertyKey, newValue) => {
            console.log(counter, propertyKey, newValue);
            counter[propertyKey] = newValue;
            if (counter.value < 0) counter.stop();
            return true;
          },
        },
      );

      return counter;
    }

    updateHTML({ counterElement, counter }) {
      return () => {
        const counterTag = "$$counter";
        const defaultText = `Staring in ${counterTag}s`;
        counterElement.innerHTML = defaultText.replace(
          counterTag,
          counter.value--,
        );
      };
    }

    startCounter({ counterElement, counter }) {
      return () => {
        const updateCounter = this.updateHTML({ counterElement, counter });
        const intervalId = setInterval(updateCounter, 1000);
        counter.stop = () => {
          console.log("stopping interval with id", intervalId);
          clearInterval(intervalId);
        };
      };
    }

    init() {
      console.log(CounterComponent.name, "starting");
      const counterElement = document.getElementById(COUNTER_ID);
      const restartBtnElement = document.getElementById("btnRestart");
      const counter = this.counterProxy;
      const startCounter = this.startCounter({ counterElement, counter });
      startCounter();
      restartBtnElement.addEventListener("click", () => {
        counter.stop();
        counter.value = COUNTER_VALUE;
        startCounter();
      });
    }
  }

  window.CounterComponent = CounterComponent;
})();

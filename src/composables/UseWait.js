export default function UseWait() {
    function wait(delay) {
        return new Promise(function (resolve) {
          setTimeout(resolve, delay);
        });
      }
  
    return { wait };
}
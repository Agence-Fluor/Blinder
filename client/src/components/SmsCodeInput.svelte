<script>
    import { tick } from 'svelte';

    let { inputDone = $bindable(), codeValue = $bindable() } = $props();

    const defaultIndicatif = 4;
    let rawDigits = $state('');
    let code = $state(formatCode(rawDigits));
    let prevValue = $state(code);

    $effect(() => { 
        if (rawDigits.length > 6) rawDigits = rawDigits.slice(0, 6);
        inputDone = rawDigits.length === 6;
        // Export the raw code digits (6 digits)
        codeValue = rawDigits;
    });

    function getPrefix() {
      return `BLINDER - `;
    }

    function formatCode(digits) {
      digits = digits.slice(0, 6);
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        formatted += digits[i];
        if ((i + 1) % 3 === 0 && i != 5)
          formatted += ' - ';
      }
      return getPrefix() + formatted;
    }

    function handleInput(e) {
      let current = e.target.value;
      if (!current.startsWith(getPrefix())) {
        e.target.value = prevValue;
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = prevValue.length;
        });
        return;
      }

      if (current.length < prevValue.length) {
        if (rawDigits.length > 0) rawDigits = rawDigits.slice(0, -1);
      } else {
        rawDigits = current.replace(getPrefix(), '').replace(/\D/g, '');
      }

      code = formatCode(rawDigits);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = code.length;
      });
      prevValue = code;
    }

</script>

<div class="w-57" style="margin-left: auto; margin-right: auto;">

  <label class="mt-4 font-semibold text-white" for="code">Code de confirmation</label>
  <br/>
  <input
    id="codeInput"
    inputmode="numeric"
    bind:value={code}
    on:input={handleInput}
    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-black text-white"
  />

</div>

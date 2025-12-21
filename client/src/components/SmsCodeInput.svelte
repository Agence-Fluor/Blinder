<script>
  import { tick } from 'svelte';

  const PREFIX = 'BLINDER - ';
  let rawDigits = '';
  let code = PREFIX;
  let prevValue = code;

  function formatCode(digits) {
    digits = digits.slice(0, 9); // max 9 chiffres
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      formatted += digits[i];
      if ((i + 1) % 3 === 0 && i + 1 < digits.length) {
        formatted += ' - ';
      }
    }
    // si on a exactement 3 ou 6 chiffres, ajouter tiret final (sauf si max 9)
    if (digits.length % 3 === 0 && digits.length !== 0 && digits.length < 9) {
      formatted += ' - ';
    }
    return PREFIX + formatted;
  }

  function handleInput(e) {
    const current = e.target.value;

    // Empêche la suppression du préfixe
    if (!current.startsWith(PREFIX)) {
      e.target.value = prevValue;
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = prevValue.length;
      });
      return;
    }

    // Détecter backspace ou suppression
    if (current.length < prevValue.length) {
      if (rawDigits.length > 0) rawDigits = rawDigits.slice(0, -1);
    } else {
      const typed = current.replace(PREFIX, '').replace(/\D/g, '');
      rawDigits = typed;
    }

    code = formatCode(rawDigits);

    // Remettre le curseur à la fin
    setTimeout(() => {
      e.target.selectionStart = e.target.selectionEnd = code.length;
    });

    prevValue = code;
  }
</script>

<input
  type="text"
  bind:value={code}
  inputmode="numeric"
  on:input={handleInput}
  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
/>

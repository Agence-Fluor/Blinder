<script>
    import { tick } from 'svelte';

    let { inputDone = $bindable() } = $props()

    let indicatifs = [
      { name: "Guyane Française", prefix: "+594", mobileStart: "0" },
      { name: "Guadeloupe", prefix: "+590", mobileStart: "0" },
      { name: "Martinique", prefix: "+596", mobileStart: "0" },
      { name: "Mayotte", prefix: "+262", mobileStart: "0" },
      { name: "Métropole", prefix: "+33", mobileStart: "0" },
      { name: "Nouvelle-Calédonie", prefix: "+687", mobileStart: "0" },
      { name: "Polynésie Française", prefix: "+689", mobileStart: "0" },
      { name: "Réunion", prefix: "+262", mobileStart: "0" },
      { name: "Saint-Barthélemy", prefix: "+590", mobileStart: "0" },
      { name: "Saint-Martin", prefix: "+590", mobileStart: "0" },
      { name: "Saint-Pierre-et-Miquelon", prefix: "+508", mobileStart: "0" },
      { name: "Wallis-et-Futuna", prefix: "+681", mobileStart: "0" }
    ];
  
    const defaultIndicatif = 4;
    let selectedIndicatif = indicatifs[defaultIndicatif]; // France par défaut
    let rawDigits = $state('');
    let phone = $state(formatPhone(rawDigits));
    let prevValue = $state(phone);
  
    $effect(() => { 
        if (rawDigits.length > 9)
            rawDigits = rawDigits.slice(0,9)

        if (rawDigits.length == 9) {
            inputDone = true 
        } else {
            inputDone = false
        }
    })

    
    function getPrefix() {
      // <-- CORRECTION : template string
      return `🇫🇷 ${selectedIndicatif.prefix} ${selectedIndicatif.mobileStart}`;
    }
  
    function formatPhone(digits) {
      digits = digits.slice(0, 9);
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        formatted += digits[i];
        if ((i % 2) != 1 && i != 8) formatted += ' ';
      }
      return getPrefix() + formatted;
    }
  
    function handleInput(e) {
      let current = e.target.value;
  
      // Empêche la suppression du préfixe
      if (!current.startsWith(getPrefix())) {
        // restore previous and keep cursor
        e.target.value = prevValue;
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = prevValue.length;
        });
        return;
      }
  
      // Détection backspace
      if (current.length < prevValue.length) {
        if (rawDigits.length > 0) 
            rawDigits = rawDigits.slice(0, -1);
      } else {
        let typed = current.replace(getPrefix(), '').replace(/\D/g, '');
        rawDigits = typed;
      }

  
      phone = formatPhone(rawDigits);
  
      // remettre le curseur à la fin
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = phone.length;
      });
  
      prevValue = phone;
    }
  
    async function changeIndicatif(e) {
      selectedIndicatif = indicatifs[e.target.selectedIndex];
      rawDigits = '';                    // <-- CORRECTION : bien séparé
      phone = formatPhone(rawDigits);
      prevValue = phone;


    await tick();

  //  setTimeout(() => {
    const input = document.getElementById('phoneInput');
    if (input) {
        input.value = phone;
        input.selectionStart = input.selectionEnd = phone.length;
        input.focus();
    }
    prevValue = phone;
 //   }, 200)

      // si tu veux, focus sur le champ :
      // document.getElementById('phoneInput')?.focus();
    }
  </script>
  
  <div>
    <label class="mt-4 font-semibold text-white" for="indicatif">Indicatif</label>
    <br/>
    <select id="indicatif" on:change={changeIndicatif} value={defaultIndicatif} class="bg-black px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition w-57">
        {#each indicatifs as t, index}
            <option class="bg-black" value={index}>{t.name}</option>
      {/each}
    </select>
  
    <br/><br/>
  
    <label class="mt-4 font-semibold text-white" for="phone">Numéro de téléphone</label>
    <br/>
    <!--input id="phoneInput" type="text" bind:value={phone} on:input={handleInput} class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition" /-->
    
    <input
        id="phoneInput"
        inputmode="numeric"
        bind:value={phone}
        on:input={handleInput}
        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
    />

    <br/><br/>
    <i class="mt-4">On est juste en France pour l'instant.</i>
  </div>
  
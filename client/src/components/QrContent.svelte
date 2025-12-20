<script>
    import QRCode from "qrcode";
  
    let text = "test"
    let size = 256
  
    let svg = "";
  
    $effect(async () => {
      if (text) {
        svg = await QRCode.toString(text, {
          type: "svg",
          width: size,
          margin: 2
        });
      }
    });
  </script>
  
  <h2>Scan QR</h2>
  {@html svg}
  
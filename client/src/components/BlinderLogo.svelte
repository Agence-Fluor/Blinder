<script>
	let { animate = $bindable() } = $props();
</script>

<style>
    
    .eye-container {
      position: relative;
      transform-style: preserve-3d;
    }

    .half-circle {
      position: absolute;
      /*border-radius: 0 0 60px 60px; /* demi-cercle vers le bas par défaut */
      transform-origin: center center;
    }
    
    .half-circle-anim {
      animation: morphHalf 4s infinite ease-in-out;
    }
    
    /* Animation de transformation demi-cercle -> trait -> demi-cercle inversé */
    @keyframes morphHalf {
      0% {
      }
      10% {
        transform: translateY(-40px) translateY(0) rotateX(90deg); /* flip partiel */
      }
      25% {
        transform: translateY(-60px) rotateX(180deg);
      }
      84% {
        transform: translateY(-60px) rotateX(180deg);
      }
      85% {
        transform: translateY(-40px) translateY(0) rotateX(90deg); /* flip partiel */
      }
      100% {

      }
    }
    
    </style>

  <div class="eye-container" style="left: -46px;">
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
    class="h-24 w-24 text-white half-circle {animate ? 'half-circle-anim' : ''}" viewBox="5 0 272 142"
    preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0.000000,142.000000) scale(0.100000,-0.100000)"
      fill="#d16b86" stroke="none">
      <path d="M495 1008 c-99 -49 -190 -99 -202 -111 -27 -24 -29 -54 -7 -85 26
      -37 65 -28 223 53 80 41 149 75 153 75 4 0 29 -24 57 -52 l50 -53 -92 -95
      c-167 -172 -179 -187 -179 -214 0 -35 29 -66 61 -66 20 0 59 32 171 145 126
      126 146 143 160 131 8 -8 43 -29 76 -48 l62 -33 -75 -170 c-82 -185 -84 -205
      -30 -235 51 -29 71 -5 155 186 l75 172 31 -9 c17 -5 59 -14 94 -20 l62 -11 0
      -177 c0 -173 1 -178 23 -199 29 -27 61 -28 87 -2 19 19 20 33 20 199 l0 178
      91 18 c50 9 94 13 98 9 5 -5 39 -80 76 -167 74 -172 95 -198 143 -181 14 5 33
      21 41 35 13 23 9 35 -60 194 -41 93 -75 172 -77 176 -2 4 6 10 16 14 11 3 47
      23 80 45 l61 39 140 -145 c147 -151 162 -161 209 -128 18 12 22 24 20 49 -2
      27 -27 59 -134 172 l-131 138 49 54 50 55 156 -78 c174 -86 205 -92 232 -43
      29 51 6 71 -205 179 -104 53 -200 97 -212 98 -14 0 -32 -13 -50 -37 -50 -66
      -147 -165 -201 -205 -66 -49 -198 -113 -277 -133 -287 -75 -611 43 -801 291
      -53 69 -71 85 -97 83 -7 0 -93 -41 -192 -91z"/>
      </g>
    </svg>
  </div>


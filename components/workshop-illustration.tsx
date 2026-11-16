export function WorkshopIllustration() {
  return (
    <div className="workshop-board" aria-hidden="true">
      <div className="board-heading">
        <span>THE SHARED WORKSHOP</span>
        <span>LL / 01</span>
      </div>
      <svg viewBox="0 0 460 300" fill="none" className="workshop-drawing">
        <defs>
          <pattern
            id="workshop-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="1" fill="#788078" opacity=".38" />
          </pattern>
        </defs>
        <rect width="460" height="300" fill="url(#workshop-grid)" />
        <g transform="rotate(-21 95 170)">
          <rect
            x="87"
            y="102"
            width="21"
            height="161"
            rx="5"
            fill="#D3B88D"
            stroke="#E6D4B6"
            strokeWidth="2"
          />
          <path
            d="M57 69H115L136 84V111H62V99H44L36 91L44 76L57 78V69Z"
            fill="#D5D8D0"
            stroke="#F0F0E7"
            strokeWidth="2"
          />
          <path
            d="M63 83H105M96 125V245"
            stroke="#8D7959"
            strokeWidth="2"
            opacity=".6"
          />
        </g>
        <g transform="rotate(8 247 160)">
          <path
            d="M177 83H275L291 97V137L272 151H178L164 136V101Z"
            fill="#C65B36"
            stroke="#EB9E7D"
            strokeWidth="2"
          />
          <path
            d="M183 150H227L213 236H172L190 165Z"
            fill="#434B43"
            stroke="#A6AD9F"
            strokeWidth="2"
          />
          <path
            d="M171 227H216L225 241V255H159V241Z"
            fill="#C65B36"
            stroke="#EB9E7D"
            strokeWidth="2"
          />
          <path d="M231 151H247V165H225" fill="#D5D8D0" />
          <path
            d="M291 100H315V135H291Z"
            fill="#9AA397"
            stroke="#D5D8D0"
            strokeWidth="2"
          />
          <path d="M315 108H329V127H315Z" fill="#D5D8D0" />
          <path
            d="M330 117H381M344 112L351 121M356 112L363 121M368 112L375 121"
            stroke="#D5D8D0"
            strokeWidth="3"
          />
          <path
            d="M180 102H225M180 111H211M180 120H205"
            stroke="#763A27"
            strokeWidth="3"
          />
          <rect
            x="244"
            y="101"
            width="27"
            height="26"
            rx="3"
            stroke="#F5CCB5"
            strokeWidth="1.5"
          />
          <path
            d="M251 114H263M257 108V120"
            stroke="#F5CCB5"
            strokeWidth="1.5"
          />
          <path d="M183 238H207" stroke="#763A27" strokeWidth="3" />
        </g>
        <g transform="rotate(29 358 221)">
          <path
            d="M345 158L335 143L337 126L348 117V136L359 143L371 136V117L382 126L384 143L374 158L369 166V268C369 280 350 280 350 268V166Z"
            fill="#BBC3B5"
            stroke="#E4E8DB"
            strokeWidth="2"
          />
          <circle cx="359.5" cy="266" r="4" stroke="#667161" strokeWidth="2" />
          <path d="M359 174V249" stroke="#8A9681" strokeWidth="3" />
        </g>
        <path d="M37 283H423" stroke="#667161" strokeWidth="1" />
        <path d="M37 278V288M423 278V288" stroke="#8F9B88" />
      </svg>
      <div className="board-caption">
        <span>GOOD TOOLS. MORE USE.</span>
        <span>Borrow · Build · Return</span>
      </div>
    </div>
  );
}

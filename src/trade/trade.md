## Functions

<dl>
<dt><a href="#trade">trade(getData, createOrders, cash, historyLength)</a> ⇒ <code>Array.&lt;object&gt;</code></dt>
<dd><p>Trades orders on the data provided, thereby creates a backtest and returns the resulting
positions. Those can be used to generate trading reports.</p>
<p>The function uses the <a href="https://www.npmjs.com/package/debug">debug</a> library for logs. Set
environment variable <code>DEBUG</code> to <code>WalkForward:*</code> to see what&#39;s happening behind the scenes:
<code>export DEBUG=WalkForward:*</code></p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Order">Order</a> : <code>object</code></dt>
<dd><p>A single order object that may be returned by the createOrder parameter in <a href="#trade">trade</a>.</p>
</dd>
<dt><a href="#BarData">BarData</a> : <code>object</code></dt>
<dd><p>A BarData object as it may be returned as an array by the getData parameter of <a href="#trade">trade</a>.</p>
</dd>
<dt><a href="#Position">Position</a> : <code>object</code></dt>
<dd><p>A single position as they are created by <a href="#trade">trade</a>.</p>
</dd>
</dl>

<a name="trade"></a>

## trade(getData, createOrders, cash, historyLength) ⇒ <code>Array.&lt;object&gt;</code>
Trades orders on the data provided, thereby creates a backtest and returns the resulting
positions. Those can be used to generate trading reports.

The function uses the [debug](https://www.npmjs.com/package/debug) library for logs. Set
environment variable `DEBUG` to `WalkForward:*` to see what's happening behind the scenes:
`export DEBUG=WalkForward:*`

**Kind**: global function  
**Returns**: <code>Array.&lt;object&gt;</code> - Array with one entry per bar (same length as param data
                                     had). Every entry is an object with
                                     - date (Date)
                                     - orders ([Order](#Order)[])
                                     - cash (number)
                                     - cost (number)
                                     - positionsOnOpen ([Object](Object)[]); positions from the
                                       previous bar, as no trades were yet made (price is the
                                       open price)
                                     - positionsAfterTrade ([Object](Object)[]); positions as they
                                       existed right after the trade (price is the open price)
                                     - positionsOnClose ([Object](Object)[]); positions when the
                                       bar closes (price is the close price)
                                     - closedPositions ([Object](Object)[]); positions that were
                                       closed on the current bar and will not exist any more on
                                       next bar  

| Param | Type | Description |
| --- | --- | --- |
| getData | <code>function</code> | Async or synchronous generator function that returns an                                      array with any amount of BarData entries. |
| createOrders | <code>function</code> | Callback function that will be called for every bar                                      returned by getData.                                      Takes the following arguments as an object: cash, positions                                      and data.                                      cash is the current cash (number)                                      positions are the currently held position an array of                                      ([Position](#Position))                                      data is an array of arrays that contain [BarData](#BarData) as                                      yielded by the getData parameter. Every entry corresponds                                      to a bar, when the first entry (0) is the youngest bar. If                                      `historyLength` is set, the length of the parameter will be                                      limited to `historyLenght`.                                      The craeteOrders function is expected to return an array                                      of ([Order](#Order)). |
| cash | <code>number</code> | Initial cash |
| historyLength | <code>number</code> | Length of data history that should be passed when calling                                      createOrders. Can be limited to prevent memory overflows                                      (as all data history is kept in memory, if not                                      explicitly reduced through historyLength; this parameter                                      is especially useful for long data series and/or high                                      resolution data). |

<a name="Order"></a>

## Order : <code>object</code>
A single order object that may be returned by the createOrder parameter in [trade](#trade).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | Position size; positive for a long and negative for                                          a short position |
| symbol | <code>string</code> | Symbol, e.g. 'AAPL'; must correspond to bar data's                                          symbol |

<a name="BarData"></a>

## BarData : <code>object</code>
A BarData object as it may be returned as an array by the getData parameter of [trade](#trade).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> | Name of the symbol, e.g. 'AAPL' |
| date | <code>Date</code> | Date of the bar |
| open | <code>number</code> | Open value |
| close | <code>number</code> | Close value |
| openExchangeRate | <code>number</code> | Exchange rate to base currency on open |
| closeExchangeRate | <code>number</code> | Exchange rate to base currency on close |
| pointValue | <code>number</code> | Equivialent of a point change in base currency,                                          especially relevant for futures. CBOT corn future e.g.                                          are 5000 bushels/contract, a tick  is 1/4 cent per                                          bushel. Point value is therefore $12.50 (one point in                                          the position's direction equals 5000 bushels * $0.0025) |
| margin | <code>number</code> | Rleative margin of the current symbol (e.g. 0.3 for a                                          30% margin) |
| settleDifference | <code>boolean</code> | True if exchange rate should only be applied to the                                          margin, not the whole position. This is especially the                                          case for futures. |

<a name="Position"></a>

## Position : <code>object</code>
A single position as they are created by [trade](#trade).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> |  |
| date | <code>Date</code> |  |
| id | <code>number</code> | Position's id; needed to track a position over multiple                                          bars |
| type | <code>string</code> | Either 'open' or 'close' |
| size | <code>number</code> | Position size; positive for a long and negative for a                                          short position |
| barsHeld | <code>number</code> | Amount of bars the position was held; starts with 0. |
| initialPosition | [<code>Position</code>](#Position) | Initial position (clone of the position when barsHeld                                          was 0 and type 'open'; needed to calculate value of                                          the position over time) |
| price | <code>number</code> | Current price (open or close, depending on type) of the                                          underlying symbol (see [BarData](#BarData)) |
| value | <code>number</code> | Positions current value (compare to initialPosition's                                          value to get current gain/loss) |
| pointValue | <code>number</code> | Current point value of the underlying symbol (see                                          [BarData](#BarData)) |
| exchangeRate | <code>number</code> | Current exchange rate of the underlying symbol (see                                          [BarData](#BarData)) |
| margin | <code>number</code> | Current margin of the underlying symbol (see                                          [BarData](#BarData)) |
| settleDifference | <code>boolean</code> | Current settle difference value of the underlying                                          symbol (see [BarData](#BarData)) |


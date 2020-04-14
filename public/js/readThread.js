window.onload = function () {
  console.log('read');
  //URLの設定
  var url = $('#threadUrl').val();
  //レス番号の設定
  var resNum = $('#resNumber').val();

  if (resNum.length < 1) {
    //レス番号がない場合は最新の1件を取得する
    getLastNumber(url);
  } else {
    //レス番号があるばあい指定したレスからすべて取得
    readThread(url);
  }

  // 新着下表示オプションがONの場合ul要素に.bottomを付与する
  if ($('#dispSort').val() === 'true') {
    $('#res-list').addClass('dispBottom');
  }

  // 自動改行オプションによってクラスを付与する
  if ($('#wordBreak').val() === 'true') {
    $('#res-list').addClass('brakeOn');
  } else {
    $('#res-list').addClass('brakeOff');
  }

  // リロードインターバル指定(ms)
  const interval = 1000 * parseInt($('#interval').val());
  //指定した秒数ごとにレス取得関数を呼び出す
  setInterval(readThread, interval, url);

  // WebSocket接続
  setInterval(checkWsConnect, 3 * 1000);
};
var socket;

const checkWsConnect = () => {
  if (socket) return;
  const port = $('#port').val();
  const url = 'ws://localhost:' + port + '/ws';
  console.log(`WS 接続開始: ${url}`);

  socket = new this.WebSocket(url);
  socket.addEventListener('open', function (e) {
    console.log('Socket 接続成功');
    // 定期的にpingを打つ
    setInterval(pingWs, 10 * 1000);
  });
  socket.addEventListener('message', (e) => {
    if (e.data === 'pong') {
      pingReturn = true;
    } else {
      console.log(e);
      prependItems(e.data);
    }
  });
};

var pingReturn = false;
const pingWs = async () => {
  console.log('[ws]ping打ち');
  pingReturn = false;
  socket.send('ping');
  await sleep(5000);
  if (!pingReturn) {
    console.log('[ws]通信が返ってこないので打ち切っった');
    socket = null;
  }
};

const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

// 最終レス番取得API
function getLastNumber(url) {
  // ポート番号の取得
  var port = $('#port').val();
  //リクエストボディの作成
  const data = makeRequestBody(url);
  const requestUrl = 'http://localhost:' + port + '/getRes';
  //fetchでレスを取得する
  fetch(requestUrl, {
    method: 'POST',
    encoding: null,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(function (res) {
      if (res.ok) {
        //ステータスOKならレスポンスをテキストにセットして返す
        return res.json();
      }
    })
    .then((resJson) => {
      //レスがなければ終了
      if (resJson.length < 1) {
        console.log('新着なし');
        return;
      }
      //レス番号更新
      $('#resNumber').val(parseInt(resJson[0].resNumber) + 1);
    })
    .catch((error) => {
      //エラー処理
      console.log(error);
    });
}

/**指定したスレを読みに行くメソッド
 *url:掲示板のURL
 *resNum:最終レス番号
 */
var readThread = function (url) {
  // ポート番号の取得
  var port = $('#port').val();
  //リクエストボディの作成
  const data = makeRequestBody(url);
  // 内部で作成したレス取得APIを呼び出す
  const requestUrl = 'http://localhost:' + port + '/getRes';
  //fetchでレスを取得する
  fetch(requestUrl, {
    method: 'POST',
    encoding: null,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(function (res) {
      if (res.ok) {
        //ステータスOKならレスポンスをテキストにセットして返す
        console.log('ok');
        return res.json();
      }
    })
    .then((resJson) => {
      //レスがなければ終了
      if (resJson.length < 1) {
        console.log('新着なし');
        return;
      }

      resJson.forEach((resObj) => {
        //レス番号更新
        $('#resNumber').val(parseInt(resObj.resNumber) + 1);
        //パースしたレスポンスをprependしていく
        prependItems(resObj.html);
      });

      /*
    一度に複数レスが来た時の扱いはどうする？
    アニメーションでレスを追加したい、アニメーションに時間かけすぎると次のレス取得が始まってしまう
    */
    })
    .catch((error) => {
      //エラー処理
      console.log(error);
    });
};

//レスをリスト追加
function prependItems(html) {
  // 表示順オプションで上に追加するか下に追加するか選ぶ
  if ($('#dispSort').val() === 'true') {
    $('#res-list').append(html);
  } else {
    $('#res-list').prepend(html);
  }
}

/** リクエスト作成
 *
 */
function makeRequestBody(url, num) {
  var data = {
    threadUrl: url,
    resNumber: $('#resNumber').val(),
  };
  return data;
}

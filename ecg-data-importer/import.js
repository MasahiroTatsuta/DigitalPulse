const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2');

// 1. ファイル名の確認（ここを実際のファイル名に合わせてください）
const CSV_FILE = 'mitbih_train.csv'; 

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234', // ご自身のパスワード
    database: 'ecg_app'
});

connection.connect((err) => {
    if (err) {
        console.error('データベース接続エラー:', err);
        return;
    }
    console.log('データベースに接続しました。');
});

const results = [];
let count = 0;

// 2. CSV読み込み開始
console.log(`${CSV_FILE} を読み込み中...`);

fs.createReadStream(CSV_FILE)
    .on('error', (err) => {
        console.error('ファイル読み込みエラー:', err.message);
    })
    .pipe(csv({ headers: false })) // ★MIT-BIHはヘッダーがないので false に設定
    .on('data', (row) => {
        // 最初の500件だけを対象にする
        if (count < 500) {
            const rowValues = Object.values(row).map(Number);
            const label = rowValues[rowValues.length - 1];
            const waveformArray = rowValues.slice(0, rowValues.length - 1);

            results.push({
                patient_id: Math.floor(Math.random() * 50) + 1,
                is_anomaly: (label !== 0),
                diagnosis_type: label,
                waveform_data: JSON.stringify(waveformArray)
            });
            count++;
        }
    })
    .on('end', () => {
        console.log(`CSVの読み込み完了: ${results.length} 件`);

        if (results.length === 0) {
            console.log('【警告】データが0件です。ファイル名や中身を確認してください。');
            connection.end();
            return;
        }

        const sql = `
            INSERT INTO ecg_records (patient_id, is_anomaly, diagnosis_type, waveform_data)
            VALUES (?, ?, ?, ?)
        `;

        // データの挿入
        results.forEach((record, index) => {
            connection.query(sql, [record.patient_id, record.is_anomaly, record.diagnosis_type, record.waveform_data], (err) => {
                if (err) console.error(`挿入エラー (Index: ${index}):`, err.sqlMessage);
                
                // 全件終わったら接続を閉じる
                if (index === results.length - 1) {
                    console.log('データベースへの挿入がすべて完了しました！');
                    connection.end();
                }
            });
        });
    });
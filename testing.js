

const http = require('http');
const detailedDiff = require("deep-object-diff").detailedDiff;
const updatedDiff = require("deep-object-diff").updatedDiff

const masternodes = [
    {ip:'167.172.126.5', latest_block: 0, blocks: {}},
    {ip:'167.99.171.245', latest_block: 0, blocks: {}}
]

let latest_block;
let curr_block = 0;

const send = (url) => {
    return new Promise((resolve) => {
        http.get(url, (resp) => {
            let data = '';
        
            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
            data += chunk;
            });
        
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try{
                    resolve(JSON.parse(data))
                } catch (err){
                    console.log("Error: " + err.message);
                    resolve({error: err.message})
                }               
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            resolve({error: err.message})
        });
    })

}

const get_block = (ip, blocknum) => {
    return send(`http://${ip}:18080/blocks?num=${blocknum}`)
}


const get_latest_block = (ip) => {
    return send(`http://${ip}:18080/latest_block`)
}


const validate_block = (blocknum) => {
    Promise.all([
        get_block(masternodes[0].ip, blocknum).then(res => {masternodes[0].blocks[blocknum] = res}),
        get_block(masternodes[1].ip, blocknum).then(res => {masternodes[1].blocks[blocknum] = res})
    ])
    .then(() => {
        if (masternodes[0].blocks[blocknum].hash === masternodes[1].blocks[blocknum].hash){
            console.log(`${blocknum} all good`)
        }else{
            console.log(JSON.stringify(masternodes[0].blocks[blocknum]))
            console.log(JSON.stringify(masternodes[1].blocks[blocknum]))
            console.log(JSON.stringify(updatedDiff(masternodes[0].blocks[blocknum], masternodes[1].blocks[blocknum])))
            console.log(JSON.stringify(detailedDiff(masternodes[0].blocks[blocknum], masternodes[1].blocks[blocknum])))
            throw new Error(`Masternodes have different block ${blocknum}`)
        }
    })
}

const check_latest_blocks = async () => {
        Promise.all([
            get_latest_block(masternodes[0].ip).then(res => {masternodes[0].latest_block = res}),
            get_latest_block(masternodes[1].ip).then(res => {masternodes[1].latest_block = res})
        ])
        .then(() => {
            if (masternodes[0].latest_block.number === masternodes[1].latest_block.number){
                console.log('all good')
                latest_block = masternodes[0].latest_block.number
                iterate_blocks();
            }else{
                throw new Error(`Masternodes have different latest blocks`)
            }
        })
}

const iterate_blocks = () => {
    for (let i = curr_block + 1; i <= latest_block; i++) {
        validate_block(i)
    }
}
check_latest_blocks()


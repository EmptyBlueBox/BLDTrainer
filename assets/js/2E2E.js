"use strict";

let inputcode = [];

function twoEdgeGenerator() {
    let eBuffer = document.getElementById("edgebuffer").value.toLowerCase();
    let cornerscramble = document.getElementById("cornerscramble").checked;
    let flipstate = document.getElementById("flipstate").checked;
    let downstate = document.getElementById("donwstate").checked;

    document.getElementById("outputScrs").value = "";
    document.getElementById("outputInfo").innerHTML = "<b>输出信息统计:</b>";

    inputcode = shuffle(Array.from(inputcode));

    let times = 0;
    let scrlist = [];

    for (let i = 0; i < inputcode.length; i++) {
        let temparr = [eBuffer, inputcode[i].toLowerCase()];
        
        if(downstate){
            let poslist = [posChichu(eBuffer),inputcode[i].toLowerCase()]
            let allpos = Array.from({ length: 4 }, (_, i) => i);
            let otherpos = allpos.filter(item => !poslist.includes(item));
            if(otherpos.length > 0){
                for (let x = 0; x < otherpos.length; x ++) {
                    temparr.push(globalState[24 + 2 * otherpos[x]]);
                }
            }
        }

        let algSet = algSetGenerator(temparr);

        let tempalgset = [];
        for (let x = 0; x < algSet.length; x ++) {
            if(posChichu(algSet[x][0]) < posChichu(algSet[x][1])){
                tempalgset.push(algSet[x]);
            }
        }
        algSet = tempalgset;

        if(flipstate===false){
            let cutedalgSet = [];
            for (let x = 0; x < algSet.length; x += 2) {
                cutedalgSet.push(algSet[x]);
            }
            algSet = cutedalgSet;
        }    
        
        algSet = shuffle(Array.from(algSet));

        for (let j = 0; j < algSet.length; j++) {
            let codelist = eBuffer;
            let poslist = [];

            let cState;
            if (cornerscramble) {
                cState = randomCorner(0);
            } else {
                cState = globalState;
            }

            poslist.push(posChichu(eBuffer));
            poslist.push(posChichu(inputcode[i].toLowerCase()));
            poslist.push(posChichu(algSet[j][0]));
            poslist.push(posChichu(algSet[j][1]));

            let allpos = Array.from({ length: 12 }, (_, i) => i);
            let otherpos = allpos.filter(item => !poslist.includes(item));
            otherpos = shuffle(Array.from(otherpos));

            for (let k = 0; k < otherpos.length; k++) {
                codelist += globalState[24 + 2 * otherpos[k] + ~~(Math.random() * 2)];
            }

            codelist += inputcode[i].toLowerCase();
            codelist += globalState[24 + 2 * posChichu(algSet[j][1])];
            codelist += algSet[j][0];
            codelist += algSet[j][1];

            console.log("codelist",codelist)

            let state = codeTrans(codelist, cState);
            times += 1;
            scrlist.push(m2p(state));
            //document.getElementById("outputScrs").value += times.toString() + ". " + m2p(state) + "\n";
        }
    }
    scrlist = shuffle(Array.from(scrlist));
    for(let i = 0; i < scrlist.length; i++) {
        document.getElementById("outputScrs").value += (i+1).toString() + ". " + scrlist[i] + "\n";
    }


    document.getElementById("outputInfo").innerHTML = "<b>输出信息统计: </b> 随机生成" + times + "条打乱，遍历输入编码的所有2E2E情况。";
    if (document.getElementById("outputScrs").value != "") {
        document.getElementById("copyBtn").style.display = "block";
    }
}

window.onload = function () {
    document.getElementById("outputScrs").value = "";
}


function selectAll() {
    let result = confirm("确认全选编码吗？");
    if (result) {
        var inputs = document.getElementById("codeselect").getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type === 'checkbox') {
                inputs[i].checked = true; // 选中复选框
            }
        }
    }
}

function clearAll() {
    let result = confirm("确认清空编码吗？");
    if (result) {
        var inputs = document.getElementById("codeselect").getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type === 'checkbox') {
                inputs[i].checked = false; // 选中复选框
            }
        }
    }
}

function input() {
    var outputInfo = "";
    inputcode = [];
    let eBuffer = document.getElementById("edgebuffer").value.toLowerCase();

    var inputs = document.getElementById("codeselect").getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].checked === true && posChichu(inputs[i].id.toLowerCase()) != posChichu(eBuffer)) {
            inputcode.push(inputs[i].id.toLowerCase());
        }
    }

    if (inputcode.length === 0) {
        outputInfo += '请您至少输入1个编码。\n';
    }

    if (outputInfo === "") {
        document.getElementById("inputInfo").innerHTML = `<b>输入信息统计: </b>您已输入${edgeCodeToDisplay(inputcode.join("")).toUpperCase()}共${inputcode.length}个编码。`
        document.getElementById("popup").style.display = "none";
    } else {
        window.alert(outputInfo);
        return;
    }
}

/**
 * Created by Administrator on 2015/12/23.
 */
(function(w){

    function TetrisCao(str){
        this.init(str);
    }

    TetrisCao.prototype.init=function(str){
        var container=document.getElementById(str);
        container.innerHTML='<canvas width="250" height="500" id="canvas"></canvas><canvas width="200" height="500" id="can_score"></canvas>';

        var canvas = document.getElementById('canvas');
        canvas.style.border='1px solid black';
        var ctx = canvas.getContext('2d');

        var can_sco = document.getElementById('can_score');
        can_sco.style.border='1px solid black';
        var ctx_sco = can_sco.getContext('2d');

        GameParas = {};
        GameParas.score = 0;
        GameParas.height = 20;
        GameParas.width = 10;
        GameParas.perWidth = 25;
        GameParas.halfW = parseInt(GameParas.width / 2) - 1;

        //方块的颜色 bdf
        GameParas.ColorArr = ['#66CCCC', '#CCFF66', '#FF99CC', '#666699', '#FF9900', '#FF6666', '#0099CC'];
        <!-- GameParas.ColorArr = ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff']; -->

        //大方块的字典数据
        GameParas.OstDictionary = {
            //0 |  1 田  2 L  3 J  4S  5Z  6土
            0: [[0, 0], [0, 1], [0, 2], [0, 3]],
            1: [[0, 0], [0, 1], [1, 0], [1, 1]],
            2: [[0, 0], [0, 1], [0, 2], [1, 2]],
            3: [[1, 0], [1, 1], [1, 2], [0, 2]],
            4: [[0, 1], [1, 1], [1, 0], [2, 0]],
            5: [[0, 0], [1, 0], [1, 1], [2, 1]],
            6: [[1, 0], [0, 1], [1, 1], [2, 1]]
        }


        GameHelper = {};
        GameHelper.Clone = function (ost) {
            var newOst = new OneSevenType(1);
            newOst.dir = ost.dir;
            newOst.typeIndex = ost.typeIndex;
            for (var i = 0; i < ost.SmallBlocksArr.length; i++) {
                newOst.SmallBlocksArr[i].x = ost.SmallBlocksArr[i].x;
                newOst.SmallBlocksArr[i].y = ost.SmallBlocksArr[i].y;
            }

            return newOst;
        }
        GameHelper.IfTouching = function (ost, key) {//key有下左右转
            var newOst = GameHelper.Clone(ost);
            if (key == 40) {//左上右下
                newOst.DownOne();
            }
            else if (key == 37) {
                newOst.LeftOne();
            }
            else if (key == 39) {
                newOst.RightOne();
            }
            else if (key == 38) {
                newOst.RotateOne();
            }

            for (var i = 0; i < newOst.SmallBlocksArr.length; i++) {
                for (var j = 0; j < gameBoard.edgeArr.length; j++) {
                    if (newOst.SmallBlocksArr[i].x == gameBoard.edgeArr[j].x && newOst.SmallBlocksArr[i].y == gameBoard.edgeArr[j].y) {
                        return true;
                    }
                }
                for (var j = 0; j < gameBoard.stoppedArr.length; j++) {
                    if (newOst.SmallBlocksArr[i].x == gameBoard.stoppedArr[j].x && newOst.SmallBlocksArr[i].y == gameBoard.stoppedArr[j].y) {
                        return true;
                    }
                }
            }
            return false;
        }
        GameHelper.GetRanIndex = function () {
            return parseInt(Math.random() * GameParas.ColorArr.length);
        }
        GameHelper.GetFullLines = function () {
            var result = {};//key 代表 y值   value代表个数
            var retArr = [];
            for (var i = 0; i < gameBoard.stoppedArr.length; i++) {
                if (gameBoard.stoppedArr[i].y in result) {
                    result[gameBoard.stoppedArr[i].y]++;
                }
                else {
                    result[gameBoard.stoppedArr[i].y] = 1;
                }

            }
            for (var k in result) {
                if (result[k] == GameParas.width) {
                    retArr.push(k);
                }
            }
            return retArr;
//            console.log(retArr);

        }

        GameHelper.Eraser = function () {
            var eraserArr = GameHelper.GetFullLines();
            for (var i = 0; i < gameBoard.stoppedArr.length; i++) {
                var result = GameHelper.GetDownNum(eraserArr, gameBoard.stoppedArr[i].y);
                if (result < 0)//说明就是这一行
                {
                    gameBoard.stoppedArr = _.without(gameBoard.stoppedArr, gameBoard.stoppedArr[i]);
                    i--;
                }
                else {
                    gameBoard.stoppedArr[i].y += result;
                }
            }
        }

        //消除的时候得到下降的num
        GameHelper.GetDownNum = function (eraserArr, y) {
            //给出应该消掉的行 和正在判断的行
            //如果返回-1 证明就是这一行那他妈就别减了直接删，如果返回0 1 2 3 就减去相应的高度
            var sum = 0;
            for (var i = 0; i < eraserArr.length; i++) {
                if (y < eraserArr[i]) {
                    sum++;
                }
                else if (y == eraserArr[i]) {
                    return -1;
                }
            }
            return sum;
        }

        //按下键得到下降num
        GameHelper.GetDownDownNum = function () {
            var num = 0;
            var newOst = GameHelper.Clone(ost);

            for (var i = 0; i <= GameParas.height; i++) {
                num++;
                newOst.DownOne();
                if (GameHelper.IfTouching(newOst, 40)) {
                    return num;//2格碰了我得返回1格
                } else {
                    continue;
                }
            }
        }
        GameHelper.LoadOst = function (SmallBlocksArr, typeIndex,offsetX,offsetY) {
            for (i = 0; i < 4; i++) {
                var x = GameParas.OstDictionary[typeIndex][i][0];
                var y = GameParas.OstDictionary[typeIndex][i][1];
                SmallBlocksArr.push(new SmallBlocks(x + offsetX, y+offsetY, typeIndex))
            }
        }

        //小方块
        function SmallBlocks(x, y, typeIndex) {
            this.x = x;
            this.y = y;
            this.color = GameParas.ColorArr[typeIndex];
        }

        //1/7方块
        function OneSevenType(i) {
            //0 |  1 田  2 L  3 J  4S  5Z  6土
            this.dir = '上';
            this.typeIndex = i;
            this.SmallBlocksArr = [];
            GameHelper.LoadOst(this.SmallBlocksArr, i,GameParas.halfW,0);
        }

        OneSevenType.prototype = {
            DownOne: function () {
                for (var i = 0; i < 4; i++) {
                    this.SmallBlocksArr[i].y++;
                }
            },
            LeftOne: function () {
                for (var i = 0; i < 4; i++) {
                    this.SmallBlocksArr[i].x--;
                }
            },
            RightOne: function () {
                for (var i = 0; i < 4; i++) {
                    this.SmallBlocksArr[i].x++;
                }
            },
            RotateOne: function () {
                if (this.typeIndex == 0) {
                    if (this.dir == '上') {
                        this.SmallBlocksArr[0].x--;
                        this.SmallBlocksArr[0].y++;
                        this.SmallBlocksArr[2].x++;
                        this.SmallBlocksArr[2].y--;
                        this.SmallBlocksArr[3].x += 2;
                        this.SmallBlocksArr[3].y -= 2;
                        this.dir = '左';
                    }
                    else {
                        this.SmallBlocksArr[0].x++;
                        this.SmallBlocksArr[0].y--;
                        this.SmallBlocksArr[2].x--;
                        this.SmallBlocksArr[2].y++;
                        this.SmallBlocksArr[3].x -= 2;
                        this.SmallBlocksArr[3].y += 2;
                        this.dir = '上';
                    }
                }
                else if (this.typeIndex == 1) {
                    return;
                }
                else if (this.typeIndex == 2) {
                    if (this.dir == '上') {
                        this.SmallBlocksArr[2].x++;
                        this.SmallBlocksArr[2].y -= 2;
                        this.SmallBlocksArr[3].x++;
                        this.SmallBlocksArr[3].y -= 2;
                        this.dir = '左';
                    }
                    else if (this.dir == '左') {
                        this.SmallBlocksArr[1].x++;
                        this.SmallBlocksArr[1].y--;
                        this.SmallBlocksArr[2].y++;
                        this.SmallBlocksArr[3].x--;
                        this.SmallBlocksArr[3].y += 2;
                        this.dir = '下';
                    }
                    else if (this.dir == '下') {
                        this.SmallBlocksArr[0].y++;
                        this.SmallBlocksArr[1].y++;
                        this.SmallBlocksArr[2].x++;
                        this.SmallBlocksArr[3].x++;
                        this.SmallBlocksArr[3].y -= 2;
                        this.dir = '右';
                    }
                    else if (this.dir == '右') {
                        this.SmallBlocksArr[0].y--;
                        this.SmallBlocksArr[1].x--;
                        this.SmallBlocksArr[2].x -= 2;
                        this.SmallBlocksArr[2].y++;
                        this.SmallBlocksArr[3].x--;
                        this.SmallBlocksArr[3].y += 2;
                        this.dir = '上';
                    }
                }
                else if (this.typeIndex == 3) {
                    if (this.dir == '上') {
                        this.SmallBlocksArr[0].x--;
                        this.SmallBlocksArr[1].x--;
                        this.SmallBlocksArr[2].y--;
                        this.SmallBlocksArr[3].x += 2;
                        this.SmallBlocksArr[3].y--;
                        this.dir = '左';
                    }
                    else if (this.dir == '左') {
                        this.SmallBlocksArr[2].x--;
                        this.SmallBlocksArr[2].y++;
                        this.SmallBlocksArr[3].x--;
                        this.SmallBlocksArr[3].y--;
                        this.dir = '下';
                    }
                    else if (this.dir == '下') {
                        this.SmallBlocksArr[1].x++;
                        this.SmallBlocksArr[1].y--;
                        this.SmallBlocksArr[2].x += 2;
                        this.SmallBlocksArr[2].y -= 2;
                        this.SmallBlocksArr[3].x++;
                        this.SmallBlocksArr[3].y++;
                        this.dir = '右'
                    }
                    else if (this.dir == '右') {
                        this.SmallBlocksArr[0].x++;
                        this.SmallBlocksArr[1].y++;
                        this.SmallBlocksArr[2].x--;
                        this.SmallBlocksArr[2].y += 2;
                        this.SmallBlocksArr[3].x -= 2;
                        this.SmallBlocksArr[3].y++;
                        this.dir = '上';
                    }
                }
                else if (this.typeIndex == 4) {
                    if (this.dir == '上') {
                        this.SmallBlocksArr[2].x--;
                        this.SmallBlocksArr[3].x--;
                        this.SmallBlocksArr[3].y += 2;
                        this.dir = '左';
                    }
                    else if (this.dir == '左') {
                        this.SmallBlocksArr[2].x++;
                        this.SmallBlocksArr[3].x++;
                        this.SmallBlocksArr[3].y -= 2;
                        this.dir = '上';
                    }
                }
                else if (this.typeIndex == 5) {
                    if (this.dir == '上') {
                        this.SmallBlocksArr[0].y++;
                        this.SmallBlocksArr[3].x -= 2;
                        this.SmallBlocksArr[3].y++;
                        this.dir = '左';
                    }
                    else if (this.dir == '左') {
                        this.SmallBlocksArr[0].y--;
                        this.SmallBlocksArr[3].x += 2;
                        this.SmallBlocksArr[3].y--;
                        this.dir = '上';
                    }
                }
                else if (this.typeIndex == 6) {
                    if (this.dir == '上') {
                        this.SmallBlocksArr[0].x--;
                        this.SmallBlocksArr[2].x--;
                        this.SmallBlocksArr[2].y++;
                        this.SmallBlocksArr[3].x--;
                        this.dir = '左';
                    }
                    else if (this.dir == '左') {
                        this.SmallBlocksArr[1].x++;
                        this.SmallBlocksArr[1].y--;
                        this.SmallBlocksArr[2].x += 2;
                        this.SmallBlocksArr[2].y -= 2;
                        this.dir = '下';
                    }
                    else if (this.dir == '下') {
                        this.SmallBlocksArr[0].y++;
                        this.SmallBlocksArr[2].x--;
                        this.SmallBlocksArr[2].y++;
                        this.SmallBlocksArr[3].y++;
                        this.dir = '右';
                    }
                    else if (this.dir == '右') {
                        this.SmallBlocksArr[0].x++;
                        this.SmallBlocksArr[0].y--;
                        this.SmallBlocksArr[1].x--;
                        this.SmallBlocksArr[1].y++;
                        this.SmallBlocksArr[3].x++;
                        this.SmallBlocksArr[3].y--;
                        this.dir = '上';
                    }
                }
            },
            DownDown: function () {
                var downNum = GameHelper.GetDownDownNum();
                for (var i = 0; i < 4; i++) {
                    this.SmallBlocksArr[i].y += downNum;
                }
            },


            Render: function () {
                var arr = this.SmallBlocksArr;
                for (var i = 0; i < 4; i++) {
                    ctx.fillStyle = arr[i].color;
                    ctx.fillRect(arr[i].x * GameParas.perWidth, arr[i].y * GameParas.perWidth, GameParas.perWidth, GameParas.perWidth);
                }
            },
        }


        function OstNext(i){
            this.SmallBlocksArr = [];
            var x=i==0?4:3;
            var y=3;
            GameHelper.LoadOst(this.SmallBlocksArr, i,x,y);
        }

        OstNext.prototype={
            Render: function () {
                var arr = this.SmallBlocksArr;
                for (var i = 0; i < 4; i++) {
                    ctx_sco.fillStyle = arr[i].color;
                    ctx_sco.fillRect(arr[i].x * GameParas.perWidth, arr[i].y * GameParas.perWidth, GameParas.perWidth, GameParas.perWidth);
                }
            }
        }

        function GameBoard() {
            this.edgeArr = [];
            this.stoppedArr = [];
            this.ostAndNextArr = [GameHelper.GetRanIndex(), GameHelper.GetRanIndex()];
            for (var i = 0; i <= GameParas.height; i++) {
                this.edgeArr.push(new SmallBlocks(-1, i));
            }

            for (var i = 0; i <= GameParas.width - 1; i++) {
                this.edgeArr.push(new SmallBlocks(i, GameParas.height));
            }
            for (var i = 0; i <= GameParas.height; i++) {
                this.edgeArr.push(new SmallBlocks(GameParas.width, i));
            }

        }

        GameBoard.prototype = {
            RefreshArr: function () {
                this.ostAndNextArr.shift();
                this.ostAndNextArr.push(GameHelper.GetRanIndex());
            },


            //碰到以后三件事 1、stoppedArr插入块 2新建块 刷新快数组  3消除
            ThingsAfterTouchingGround:function(){
                for (var i = 0; i < ost.SmallBlocksArr.length; i++) {
                    this.stoppedArr.push(ost.SmallBlocksArr[i]);
                }
                this.RefreshArr();
                ost = new OneSevenType(this.ostAndNextArr[0]);
                ostNext=new OstNext(this.ostAndNextArr[1]);

                GameHelper.Eraser();
            },

            Render: function () {
//                for (var i = 0; i < this.edgeArr.length; i++) {
//                    ctx.fillStyle = this.edgeArr[i].color;
//                    ctx.fillRect(this.edgeArr[i].x * GameParas.perWidth, this.edgeArr[i].y * GameParas.perWidth, GameParas.perWidth, GameParas.perWidth);
//                }
                for (var i = 0; i < this.stoppedArr.length; i++) {
//                    ctx.strokeStyle='black';
//                    ctx.strokeRect(this.stoppedArr[i].x * GameParas.perWidth, this.stoppedArr[i].y * GameParas.perWidth, GameParas.perWidth, GameParas.perWidth)
                    ctx.fillStyle = this.stoppedArr[i].color;
                    ctx.fillRect(this.stoppedArr[i].x * GameParas.perWidth, this.stoppedArr[i].y * GameParas.perWidth, GameParas.perWidth, GameParas.perWidth);
                }
            }
        }


        function Game() {

        }

        Game.prototype = {
            mainLoop: function () {

                //主循环
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx_sco.clearRect(0, 0, can_sco.width, can_sco.height);

                ost.Render();
                ostNext.Render();
                gameBoard.Render();
            },
            secLoop: function () {//只判断往下掉 是否可以新建ost了
                if (!GameHelper.IfTouching(ost, 40)) { //没碰到下降
                    ost.DownOne();
                }
                else { //碰到了就新建ost
                    gameBoard.ThingsAfterTouchingGround();

                }
            },
            run: function () {
                var that = this;
                setInterval(that.mainLoop, 30);
            },
            secRun: function () {
                var that = this;
                setInterval(that.secLoop, 500);
            }

        }


        window.onkeydown = function (e) {
            var e = e || event;
            var c = e.keyCode;
            if (c == 37 || c == 38 || c == 39 || c == 40) {
                e.preventDefault();
                if (c == 37 && !GameHelper.IfTouching(ost, 37)) {
                    ost.LeftOne();
                }
                else if (c == 39 && !GameHelper.IfTouching(ost, 39)) {
                    ost.RightOne();
                }
                else if (c == 38 && !GameHelper.IfTouching(ost, 38)) {
                    ost.RotateOne();
                }
                else if (c == 40 && !GameHelper.IfTouching(ost, 40)) {
                    ost.DownDown();
                    gameBoard.ThingsAfterTouchingGround();

                }
            }


        }
        var game = new Game();
        var gameBoard = new GameBoard();
        var ost = new OneSevenType(gameBoard.ostAndNextArr[0]);
        var ostNext=new OstNext(gameBoard.ostAndNextArr[1]);
        game.run();
        game.secRun();
    }

    w.TetrisCao=TetrisCao;
})(window)
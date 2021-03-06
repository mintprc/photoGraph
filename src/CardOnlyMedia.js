import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import imageDatas from './imageDatas.json';
import ImageFigure from './ImageFigure';
import './CardOnlyMedia.css';
import ControllerUnit from './ControllerUnit';

//遍历json数组，把图片名拼装成url
function genImageURL(imageDataArr) {
    for (let i = 0, j = imageDatas.length; i < j; i++) {
        let singleImageData = imageDataArr[i];
        singleImageData.imageURL = require('./images/' + singleImageData.fileName);
        imageDataArr[i] = singleImageData;
    }
    return imageDataArr;
}

let imageDataArr = genImageURL(imageDatas);
//alert(imageDataArr[0].imageURL); 在指定范围内产生一个随机数
function randomValue(value1, value2) {
    if (value2 < value1) {
        let temp = value1;
        value1 = value2;
        value2 = temp;
    }

    return Math.ceil(Math.random() * (value2 - value1) + value1);
}

//产生一个随机角度
function randomAngle(maxAngle) {
    maxAngle = maxAngle
        ? maxAngle
        : 30;

    return Math.random() > 0.5
        ? ''
        : '-' + randomValue(0, maxAngle);
}

class CardOnlyMedia extends Component {

    Constant = {
        centerPos: {
            left: 0,
            top: 0
        },
        hPosRange: {
            leftSecX: [
                0, 0
            ],
            rightSecX: [
                0, 0
            ],
            y: [0, 0]
        },
        vPosRange: {
            x: [
                0, 0
            ],
            topY: [0, 0]
        }
    };

    constructor() {
        super();
        this.state = {
            imgsArrangeArr: [/*
                {
                    pos: {
                        left: 0,
                        top: 0
                    },
                    rotate: 0,//这个属性是图片随机倾斜角度，由于是添加再transform里的属性，所以影响了之后添加的transform属性，因此应当把边缘图片的点击旋转锁定。
                    isInverse: false,  //在子组件的render里会判断这个属性true则追加一个翻转的class
                    isCenter: false,  //用这个属性判断居中，并用于锁定翻转功能
                },
                */
                ]
        };
    }

    //为指定图片设置旋转，并更新状态调用render
    inverse(i) {
        const imgsArrangeArr = this.state.imgsArrangeArr;
        imgsArrangeArr[i].isInverse = !imgsArrangeArr[i].isInverse;
        this.setState({imgsArrangeArr: imgsArrangeArr});
    }

    // //把点击的图片放到中间，并重新排版其他图片 center(i) {     //
    // 首先把指定居中图片的isCenter和isInverse置为false，把选中图片的isCenter置为true 但是此时并不知道哪张图片居中，所以由指定
    //     reArrange(i); } 组件加载完后，计算组件在各版块的坐标范围
    componentDidMount() {
        //获取底面板
        let stageDOM = ReactDOM.findDOMNode(this.refs.stage);
        //获取底面板的长宽
        let stageW = stageDOM.scrollWidth,
            stageH = stageDOM.scrollHeight;
        //计算底面板中心坐标
        let halfStageW = Math.ceil(stageW / 2),
            halfStageH = Math.ceil(stageH / 2);

        //使用ref获取一个ImageFigure，此处是为了获取核心组件的dimension
        let imgFigureDOM = ReactDOM.findDOMNode(this.refs.imgFigure0);
        //获取ImageFigure的长宽
        let imgW = imgFigureDOM.scrollWidth,
            imgH = imgFigureDOM.scrollHeight;
        //获取ImageFiugre的半边长，用于计算ImageFigure左上角坐标
        let halfImgW = Math.ceil(imgW / 2),
            halfImgH = Math.ceil(imgH / 2);

        //计算中央版块的坐标this.Constant.enterPos
        this.Constant.centerPos = {
            left: halfStageW - halfImgW,
            top: halfStageH - halfImgH
        };

        //计算水平（左右）版块图片的坐标范围this.Constant.hPosRange 左边版块的x坐标范围
        this.Constant.hPosRange.leftSecX[0] = -halfImgW;
        this.Constant.hPosRange.leftSecX[1] = halfStageW - halfImgW * 3;
        //右边版块的x坐标范围
        this.Constant.hPosRange.rightSecX[0] = halfStageW + halfImgW;
        this.Constant.hPosRange.rightSecX[1] = stageW - halfImgW;
        //计算水平版块的y坐标范围
        this.Constant.hPosRange.y[0] = -halfImgH;
        this.Constant.hPosRange.y[1] = stageH - halfImgH;

        //计算顶部版块的坐标范围 this.Constant.vPosRange 计算顶部Y坐标范围
        this.Constant.vPosRange.topY[0] = -halfImgH;
        this.Constant.vPosRange.topY[1] = halfStageH - halfImgH * 3;
        //计算顶部x坐标范围
        this.Constant.vPosRange.x[0] = halfStageW - imgW;
        this.Constant.vPosRange.x[1] = halfStageW;

        //各版块坐标计算完后，把图片填充到各版块，各版块内的图片按坐标范围排布
        this.reArrange(0);

    }

    center(i) {
        this.reArrange(i);
    }

    //排布图片，首先为各个版块确定图片数量和坐标，然后填入图片索引 完全重排布，点选任何非中心图片，则展示到中心，并重新排布其他所有图片
    reArrange(centerIndex) {
        //获取this.state中的图片坐标数组，该数组中是每张图片的坐标
        let imgsArrangeArr = this.state.imgsArrangeArr,
            Constant = this.Constant;
        //从this.Constant中取出各个版块的坐标范围
        let centerPos = Constant.centerPos,
            hPosRange = Constant.hPosRange,
            vPosRange = Constant.vPosRange;
        //获取每个范围的具体坐标值
        let hPosRangeLeftSecX = hPosRange.leftSecX, //左边x
            hPosRangeRightSecX = hPosRange.rightSecX, //右边x
            hPosRangeY = hPosRange.y, //水平方向的y
            vPosRangeTopY = vPosRange.topY, //垂直方向（顶部）的y
            vPosRangeX = vPosRange.x; //垂直方向（顶部）的x

        //构建对象用于接收每个版块图片的坐标值 center，根据函数形参取出图片作为中央图片
        let imgsArrangeCenterArr = imgsArrangeArr.splice(centerIndex, 1); //获取居中图片的位置信息
        //把中心坐标赋予中央图片，pos是只有两个键值,left,top，和this.Constant.enterPos相同
        imgsArrangeCenterArr[0].pos = centerPos;
        //把中央图片的旋转角度置0
        imgsArrangeCenterArr[0].rotate = 0;

        imgsArrangeCenterArr[0] = {
            pos: centerPos,
            rotate: 0,
            isCenter: true,
            isTop: false
        }

        //top
        let imgsArrangeTopArr = [], //上部图片的位置信息
            topImageNumber = Math.floor(Math.random() * 2), //上部的图片数量，0或1，随机值（0,2），去1法，只产生两个整数0,1
            topImgSpliceIndex = 0; //上部图片的索引
        // 判断top是否有图片，如果有，则计算坐标并随机取出一个图片填充 可以使用if，但是splice会剔除指定数量，剔除后，后续遍历不会重复出现
        // 首先确定随机种子的位置，然后从这个位置开始splice 因为产生的是索引所以，随机点必须合法，但如果数量为0就无所谓了
        topImgSpliceIndex = Math.ceil(Math.random() * (imgsArrangeArr.length - topImageNumber));
        //产生了图片索引之后，取出图片坐标数组（此时坐标还没产生）
        imgsArrangeTopArr = imgsArrangeArr.splice(topImgSpliceIndex, topImageNumber);
        //遍历数组，产生坐标值
        imgsArrangeTopArr.forEach((value, index) => {
            // value是pos->left,right index可能是0或1 在top的范围内生成坐标 x value.pos.left =
            // randomValue(vPosRangeX[0], vPosRangeX[1]); y value.pos.top =
            // randomValue(vPosRangeTopY[0], vPosRangeTopY[1]); value.rotate =
            // randomAngle();
            imgsArrangeTopArr[index] = {
                pos: {
                    left: randomValue(vPosRangeX[0], vPosRangeX[1]),
                    top: randomValue(vPosRangeTopY[0], vPosRangeTopY[1])
                },
                rotate: randomAngle(),
                isCenter: false,
                isTop: true
            };
            //alert("value "+value.left+", "+value.top);
        });
        // alert(imgsArrangeTopArr[0].left + ", " + imgsArrangeTopArr[0].top); left &
        // rightl 为剩余的坐标数组产生坐标
        // 第一次渲染默认调用render，渲染完毕，由于重写了didmount，其中调用了setstate，所以再次重新渲染，这次渲染，数据发生了变化
        imgsArrangeArr.forEach((value, index) => {
            let hPosRangeTempX = null;
            //如果索引是奇数，放左边
            if (index % 2 === 1) {
                // value.pos.left = randomValue(hPosRangeLeftSecX[0], hPosRangeLeftSecX[1]);
                hPosRangeTempX = hPosRangeLeftSecX;
            } else {
                // value.pos.left = randomValue(hPosRangeRightSecX[0], hPosRangeRightSecX[1]);
                hPosRangeTempX = hPosRangeRightSecX;
            }
            // value.pos.top = randomValue(hPosRangeY[0], hPosRangeY[1]);
            imgsArrangeArr[index] = {
                pos: {
                    left: randomValue(hPosRangeTempX[0], hPosRangeTempX[1]),
                    top: randomValue(hPosRangeY[0], hPosRangeY[1])
                },
                rotate: randomAngle(),
                isCenter: false,
                isTop: false
            };
        });

        //之前缺少最后一张图片的bug，是由于产生top图片数量的时候使用了ceil天花板函数，导致0~2最大为2，应该改用floor函数，最大取1
        // 接下来把新的结果拼接回去 top
        if (imgsArrangeTopArr && imgsArrangeTopArr[0]) {
            imgsArrangeArr.splice(topImgSpliceIndex, 0, imgsArrangeTopArr[0]);
        }
        //center
        imgsArrangeArr.splice(centerIndex, 0, imgsArrangeCenterArr[0]);

        //设置状态，重新渲染
        this.setState({imgsArrangeArr: imgsArrangeArr});
    }

    render() {

        let controllerUnits = [],
            imgFigures = [];

        //遍历图片数组，填充到ImageFigure中
        imageDataArr.forEach(function (value, index) {
            //此处初始化state里的imgsArrangeArr，长度等于imageDataArr数组，映射后者图片的坐标
            if (!this.state.imgsArrangeArr[index]) {

                this.state.imgsArrangeArr[index] = {
                    pos: {
                        left: 0,
                        top: 0
                    },
                    rotate: 0
                };
            }

            // alert(index+" "+this.state.imgsArrangeArr[index].rotate);
            // 在此处顺便传入对应索引的坐标信息，在组件的定义中，使用这个属性渲染坐标
            imgFigures.push(<ImageFigure
                key={index}
                data={value}
                ref={'imgFigure' + index}
                position={this.state.imgsArrangeArr[index]}
                center={() => this.center(index)}
                inverse={() => this.inverse(index)}/>);
            controllerUnits.push(
                <ControllerUnit
                    key={index}
                    position={this.state.imgsArrangeArr[index]}
                    inverse={() => this.inverse(index)}
                    center={() => this.center(index)}></ControllerUnit>
            )
        }.bind(this));

        //构建新的组件，把心构建的ImageFigures数组填充进来
        return (
            <section className="stage" ref="stage">
                <section className="img-sec">
                    {imgFigures}
                </section>
                <nav className="controller-nav">
                    {controllerUnits}
                </nav>
            </section>
        );
    }
}

export default CardOnlyMedia;
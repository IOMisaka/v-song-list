import React, { useState, useEffect, useRef } from 'react';
import { SyncOutlined, YoutubeOutlined, SearchOutlined } from '@ant-design/icons';
import {
    Layout,
    Avatar,
    Row,
    Col,
    Input,
    Button,
    BackTop,
    message,
    Table,
    Tag,
    Drawer,
    notification
} from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import jData from './assets/data.json';
import copy from 'copy-to-clipboard';
import avatarImage from './assets/avatar.jpg';
import pixelImage from './assets/pixel.gif';
import sideImage from './assets/bg.avif';
import './App.css';



const { Content } = Layout;

const baseColor = '#c362d3';
const numColor = '#38fff8';
const songColor = 'white';
const tipColor = 'white';
const baseFontSize = '1rem';
const nameFontSize = '2.5rem';
const numFontSize = '1.8rem';

const colorTable = [
    {
        price: 30,
        bgColor: '#2196F3',
        fColor: 'rgba(255,255,255,1)',
    },
    {
        price: 138,
        bgColor: '#e09443',
        fColor: 'rgba(0,0,0,1)',
    },
    {
        price: 1000,
        bgColor: '#e54d4d',
        fColor: 'rgba(0,0,0,1)',
    },
    {
        price: 2000,
        bgColor: 'rgba(255,202,40,1)',
        fColor: 'rgba(0,0,0,0.87451)',
    },
    {
        price: 3000,
        bgColor: 'rgba(245,124,0,1)',
        fColor: 'rgba(255,255,255,0.87451)',
    },
    {
        price: 4000,
        bgColor: 'rgba(233,30,99,1)',
        fColor: 'rgba(255,255,255,1)',
    },
    {
        price: 700,
        bgColor: 'rgba(230,33,23,1)',
        fColor: 'rgba(255,255,255,1)',
    },
]
let colorDict = new Map<string, any>();
colorDict.set('舰长', {
    bgColor: '#4471e7',
    fColor: 'rgba(255,255,255,1)'
})
colorDict.set('提督', {
    bgColor: '#915dde',
    fColor: 'rgba(255,255,255,1)'
})
colorDict.set('总督', {
    bgColor: '#b8485f',
    fColor: 'rgba(255,255,255,1)'
})

interface IDataType {
    key: number;
    money: string;
    song: string;
    link: string;
    singer: string;
    tags: string[];
    remark: string;
}

interface IMqAlive {
    alive?: boolean;
    nickname?: string;
    cid?: string;
}

interface IMqNormalMsg {
    msg?: string;
    nickname?: string;
    ts?: number;
}

const TdCell = (props: any) => {
    // onMouseEnter, onMouseLeave在数据量多的时候，会严重阻塞表格单元格渲染，严重影响性能
    const { onMouseEnter, onMouseLeave, ...restProps } = props;
    return <td {...restProps} />;
};

function randomString(e: number) {
    e = e || 32;
    let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a));
    return n
}

let g_callbackMap: any = {};
let g_on = false;
let mqClientId = localStorage.getItem('clientId') || (randomString(5) + '_NoName');
if (mqClientId.length < 7) {
    mqClientId = randomString(5) + '_NoName';
}
let nickname = mqClientId.substring(6);
let mqClient: any;
let publish = (topic: string, body: string) => {
    if (mqClient) {
        mqClient.publish(topic, body);
    }
};



function registerCallback(topic: string, callback: Function) {
    g_callbackMap[topic] = callback;
}
const decoder = new TextDecoder('utf-8');

const App: React.FC = () => {
    const [data, setData] = useState<IDataType[]>(jData?.data);
    const [songNum, setNum] = useState<number>(jData?.data?.length);
    const [searchValue, setSearchValue] = useState<string>('');
    const [visable, setVisible] = useState<boolean>(false);
    const [notice, setNotice] = useState<string>('');
    const [aliveList, setAlive] = useState<IMqAlive[]>([]);
    const [chatMsg, setMsg] = useState<IMqNormalMsg[]>([]);
    const [MyNickName, setNick] = useState(nickname);
    const [ChatVis, setChatVis] = useState<number>(0);
    const bottomLine = useRef<HTMLDivElement>(null);
    const totalNum = jData?.data?.length;
    const scrollToBottom = () => {
        if (bottomLine && bottomLine.current) {
            bottomLine.current.scrollIntoView({ behavior: 'auto' });
        }
    }

    const showDrawer = () => {
        setVisible(true);
    };

    const closeDrawer = () => {
        setVisible(false);
    };

    const random_a_song = () => {
        let record: IDataType = data[Math.floor(Math.random() * data.length)];
        copy('点歌 ' + record.song);
        let pre="";
        if(record.money!='')pre="需要【"+record.money+"】";
        message.success(pre+'"点歌 ' + record.song + '"成功复制到剪贴板，快去直播间点歌吧~');
    }

    const columns: ColumnsType<IDataType> = [
        {
            title: '',
            dataIndex: 'money',
            width: 50,
            render: (money: string) => {
                let bgColor = '#73bd67';
                let fColor = 'rgba(255，255，255,1)';
                if (money === '')return (<></>)
                if (colorDict.has(money)) {
                    let colorObj = colorDict.get(money);
                    bgColor = colorObj?.bgColor;
                    fColor = colorObj?.fColor
                }
                return (
                    <Tag color={bgColor} key={money} style={{ color: fColor, margin: 0, cursor: "pointer" }}
                        onClick={() => {
                            setSearchValue(searchValue + " !M:" + money);
                        }}>
                        {money}
                    </Tag>
                );
                
            },
        },
        {
            title: '',
            dataIndex: 'link',
            width: 25,
            render: (link: string) => {
                if (link.length > 0)
                    return (
                        <a href={link} target='_blank' rel="noreferrer"><Button shape="circle"
                            icon={<YoutubeOutlined />} /></a>
                    );
                else
                    return (<></>);

            }
        },
        {
            title: '歌名',
            dataIndex: 'song',
            width: 250,
        },
        {
            title: '歌手',
            dataIndex: 'singer',
            width: 100,
        },
        {
            title: '标签',
            dataIndex: 'tags',
            render: (tags: string[]) => (
                <span>
                    {tags.map(tag => {
                        return (
                            <Tag color={'cyan'} key={tag} onClick={() => {
                                setSearchValue(searchValue + " !T:" + tag);
                            }} style={{ cursor: "pointer" }}>
                                {tag.toUpperCase()}
                            </Tag>
                        );
                    })}
                </span>
            ),
        },
    ];

    function on_alive(topic: string, payload: Uint8Array, packet: any) {
        let p: IMqAlive = {};
        if (payload.length > 0) {
            p = JSON.parse(decoder.decode(payload));
        }
        if (topic.startsWith('u0/alive/')) {
            const cid = topic.substring('u0/alive/'.length);
            if ("alive" in p && p.alive) {
                console.log(`${cid} 在线，nickname: ${p.nickname}`);
                setAlive(current => [...current.filter(alive => {
                    return alive.cid !== cid;
                }), {
                    nickname: p.nickname ? p.nickname : 'NoName',
                    cid: cid
                }]);
            } else {
                console.log(`${cid} 已下线`);
                setAlive(current => current.filter(alive => {
                    return alive.cid !== cid;
                }));
            }
        }
    }

    function on_notice(topic: string, payload: Uint8Array, packet: any) {
        let p: IMqNormalMsg = {};
        if (payload.length > 0) {
            p = JSON.parse(decoder.decode(payload));
        }
        if (topic === 'u0/notice' && "msg" in p) {
            if ("msg" in p) {
                console.log(`公告：${p.msg ? p.msg : ''}`);
                setNotice(p.msg ? p.msg : '');
            } else {
                setNotice('');
            }
        }
    }

    function on_broadcast(topic: string, payload: Uint8Array, packet: any) {
        let p: IMqNormalMsg = {};
        if (payload.length > 0) {
            p = JSON.parse(decoder.decode(payload));
        }
        if (topic === 'u0/broadcast') {
            if ("msg" in p && "nickname" in p) {
                const nickname = p.nickname ? p.nickname : 'NoName';
                const msg = p.msg ? p.msg : '';
                const ts = p.ts ? p.ts : new Date().getTime();
                console.log(`消息：[${nickname}] => ${msg}`);
                setMsg(current => [...current.filter(x => {
                    return x.nickname !== nickname || x.msg !== msg || x.ts !== ts;
                }), { nickname: nickname, msg: msg, ts: ts }]);
            }
        }
    }

    registerCallback('alive', on_alive);
    registerCallback('notice', on_notice);
    registerCallback('broadcast', on_broadcast);
    try {
        //start_listen();
    } catch (e) {
    }

    function changeName() {
        let name = prompt("请输入你的新名字", MyNickName);
        if (name && name.trim().length > 0) {
            setNick(name.trim());
        }
    }

    function sengMsg() {
        let msg = prompt("请输入你要发送的消息", '');
        if (msg) {
            if (msg.length > 0 && msg.length <= 1024) {
                publish('u0/broadcast', JSON.stringify({ msg: msg, nickname: MyNickName, ts: new Date().getTime() }));
            } else {
                message.warn('发送文本字符数量需要大于0小于等于1024');
            }
        }
    }

    useEffect(() => {
        const newClientId = mqClientId.substring(0, 6) + MyNickName;
        localStorage.setItem('clientId', newClientId);
    }, [MyNickName]);


    useEffect(() => {
        scrollToBottom();
    }, [chatMsg]);

    useEffect(() => {
        if (notice !== '') {
            notification.open({
                message: '公告',
                description: notice,
            });
        }
    }, [notice]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== '') {
                setData(
                    jData?.data?.filter(
                        item => {
                            let words: string[] = searchValue.trim().replaceAll(',', ' ').replaceAll('，', ' ').split(' ');
                            for (let word of words) {
                                let lword = word.toUpperCase();
                                if (lword.startsWith("!T:")) {
                                    if (!(item?.tags?.indexOf(lword.slice(3)) !== -1))
                                        return false;
                                    continue;
                                }
                                if (lword.startsWith("!M:")) {
                                    if (!(item?.money?.indexOf(lword.slice(3)) !== -1))
                                        return false;
                                    continue;
                                }
                                if (!(item?.song?.toUpperCase().indexOf(lword) !== -1 ||
                                    item?.singer?.toUpperCase().indexOf(lword) !== -1 ||
                                    item?.remark?.toUpperCase().indexOf(lword) !== -1
                                ))
                                    return false;
                            }
                            return true;
                        }
                    )
                );
            } else {
                setData(jData?.data);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [searchValue]);

    useEffect(() => {
        setNum(data.length);
    }, [data]);

    return (
        <Layout style={{ minHeight: '100%', padding: '10px', backgroundColor: '#ffffff7f' }}>
            <div className={'chat-pannel'} style={{ display: 'none' }}>
                <div className={'alive-cnt'} onClick={() => {
                    setChatVis((ChatVis + 1) % 3);
                }}>在线人数：{aliveList.length}</div>
                <div className={ChatVis === 1 ? 'chat-pannel-in show' : 'chat-pannel-in'}>
                    <div className={'nickname-btn'} onClick={changeName}>{MyNickName}</div>
                    <div className={'send-msg-btn'} onClick={sengMsg}>发送消息</div>
                </div>
            </div>
            <div className={ChatVis < 2 ? 'chat-view' : 'chat-view hide'}>
                {chatMsg.map((value, index) => {
                    return (<div key={index} className={'chat-wrapper'}>
                        <div
                            className={'chat-profile'}>{(value.nickname?.substring(0, 1) || 'N').toUpperCase()}</div>
                        <div className={'chat-content-wrapper'}>
                            <div className={'chat-nickname'}>{value.nickname}</div>
                            <div className={'chat-content'}>{value.msg}</div>
                        </div>
                    </div>)
                })}
                <div ref={bottomLine}></div>
            </div>
            <Content>
                <Row justify={'center'}>
                    <Col
                        xxl={12} xl={16} lg={18} md={20} sm={22} xs={24} style={{ backgroundColor: '#00000033' }}>
                        <Row justify={'center'} style={{ marginTop: 10 }}>
                            <div onClick={showDrawer} style={{ cursor: "pointer" }}>
                                <Avatar
                                    className={'bili-avatar'}
                                    size={{ xs: 100, sm: 150, md: 180, lg: 200, xl: 220, xxl: 250 }}
                                    src={avatarImage}
                                    style={{
                                        border: '3px solid ' + baseColor,
                                        boxShadow: '2px 2px #0000007f',
                                    }}
                                />
                            </div>
                        </Row>
                        <Row justify={'center'} style={{ marginTop: 10, cursor: "pointer" }} onClick={showDrawer}>
                            <span style={{
                                fontSize: nameFontSize,
                                color: baseColor,
                                lineHeight: '1.2em',
                                textShadow: '1px 1px #0000007f',
                                fontWeight: "bolder",
                            }}>温柔小茄</span>
                        </Row>
                        <Row justify={'center'} style={{ marginTop: 10, cursor: "pointer" }} onClick={showDrawer}>
                            <span style={{
                                fontSize: numFontSize,
                                color: songColor,
                                lineHeight: '1.2em',
                                textShadow: '1px 1px #0000007f',
                                fontWeight: "bolder",
                            }}>为你带来了</span>
                            <span style={{
                                fontSize: numFontSize,
                                color: numColor,
                                lineHeight: '1.2em',
                                textShadow: '1px 1px #ffffff7f',
                                fontWeight: "bolder",
                            }}>{songNum}</span>
                            <span style={{
                                fontSize: numFontSize,
                                color: songColor,
                                lineHeight: '1.2em',
                                textShadow: '1px 1px #0000007f',
                                fontWeight: "bolder",
                            }}>首歌👍</span>
                        </Row>
                        <Row justify={'center'} style={{ marginTop: 10, cursor: 'pointer' }} onClick={showDrawer}>
                            <span style={{
                                fontSize: '1rem',
                                color: tipColor,
                                lineHeight: '1.2em',
                                textShadow: '1px 1px black',
                                fontWeight: "bolder",
                            }}>~点击头像👆查看更多信息~</span>
                        </Row>
                        <Row justify={'center'}>
                            <span style={{
                                fontSize: '1rem',
                                color: tipColor,
                                lineHeight: '1.2em',
                                textShadow: '1px 1px black',
                                fontWeight: "bolder",
                            }}>~双击列表🐧即可复制点歌指令~</span>
                        </Row>
                        <Row style={{ margin: '0 10px' }}>{jData?.tags?.map((tag) => {
                            return (
                                <Tag color={'cyan'} key={tag} onClick={() => {
                                    setSearchValue(searchValue + " !T:" + tag);
                                }} style={{ cursor: "pointer", margin: '5px' }}>
                                    {tag.toUpperCase()}
                                </Tag>
                            );
                        })}</Row>
                        <Row style={{ padding: 10 }}>
                            <Col span={15} style={{ paddingRight: 10 }}>
                                <Input placeholder={'输入关键字看看有没有你想听的？'}
                                    style={{
                                        fontSize: baseFontSize,
                                        borderRadius: baseFontSize,
                                    }}
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    value={searchValue}
                                    onChange={e => {
                                        setSearchValue(e.target.value || '')
                                    }}
                                ></Input>
                            </Col>
                            <Col span={9}>
                                <Button type="primary" shape="round"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        fontSize: baseFontSize,
                                        backgroundColor: baseColor,
                                        borderColor: baseColor,
                                    }}
                                    icon={<SyncOutlined />} onClick={random_a_song}>随机一个</Button>
                            </Col>
                        </Row>
                        <Row style={{ padding: '0 10px 10px 10px' }}>
                            <div className={'my-table-wrapper'} style={{ width: '100%', overflowX: "auto" }}>
                                <div style={{ minWidth: '600px', width: '100%' }}>
                                    <Table
                                        dataSource={data}
                                        columns={columns}
                                        pagination={false}
                                        onRow={(record: IDataType) => {
                                            return {
                                                onDoubleClick: () => {
                                                    copy('点歌 ' + record.song);
                                                    let pre="";
                                                    if(record.money!='')pre="需要【"+record.money+"】";
                                                    message.success(pre+'"点歌 ' + record.song + '"成功复制到剪贴板，快去直播间点歌吧~');
                                                },
                                            };
                                        }}
                                        size={"small"}
                                        style={{ width: '100%' }}
                                        rowKey={record => record.key}
                                        components={{
                                            body: { cell: TdCell },
                                        }}
                                    />
                                </div>
                            </div>
                        </Row>
                    </Col>
                </Row>
                <BackTop style={{ height: '50em', width: '50em', fontSize: "0.3rem" }}>
                    <div><img src={pixelImage} alt="pixel" style={{ width: '100%' }} /></div>
                </BackTop>
                <Drawer className='bgDrawer' visible={visable} onClose={closeDrawer} size={"default"} >
                    <Row justify={"center"}>
                        <Col span={24} style={{ fontSize: '18px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '24px' }}>♡置顶♡</div>
                            <div>你好！我是<span
                                style={{
                                    color: baseColor,
                                    fontSize: '20px',
                                    fontWeight: "bolder"
                                }}>温柔小茄</span>~一个个人歌势！！
                            </div>
                            <div>关于名字…注册那天看到网上说你的性格+上一顿刚吃过的东西就是名字。</div>
                            <div>我不太想叫温柔的红烧茄子，所以是温柔小茄啦！</div>
                            <div>喜欢唱歌！歌单在专栏~偶尔打游戏但是很菜！</div>
                            <div>会多投翻唱的~大家有想让小茄唱的歌可以发在评论区！</div>
                            <div>直播时间一般是晚上21：00~</div>
                            <div>其他时间随机掉落~很高兴遇到你！</div>
                        </Col>
                    </Row>
                    <Row
                        className={"InfoButtonWrapper"}
                        justify={'center'}
                        style={{
                            width: '100%',
                        }}
                    >
                        <Button className={'BtnBiliSpace'}
                            title='进入个人空间'
                            onClick={() => window.open("https://space.bilibili.com/3537114887097069/dynamic")}>
                            <div className={'BtnContent'}>
                                <img alt={'bilibili'} src={'https://www.bilibili.com/favicon.ico'}></img>
                                <span>温柔小茄的动态</span>
                            </div>
                        </Button>
                        <Button className={'BtnBiliLive'}
                            title='进入直播间'
                            onClick={() => window.open("https://live.bilibili.com/30526675")}>
                            <div className={'BtnContent'}>
                                <img alt={'bilibili直播'} src={'https://www.bilibili.com/favicon.ico'}></img>
                                <span>BiliBili直播间</span>
                            </div>
                        </Button>
                        <Button className={'BtnBiliLive'}
                            title='观看录播'
                            onClick={() => window.open("https://space.bilibili.com/62790545")}>
                            <div className={'BtnContent'}>
                                <img alt={'录播'} src={'https://www.bilibili.com/favicon.ico'}></img>
                                <span>温柔小茄录播</span>
                            </div>
                        </Button>
                        <Button className={'BtnQQun'}
                            title='点击加入'
                            onClick={() => window.open("http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=TFdnY7oxBZuq5tUCfrGRdE41BE7Comkq&authKey=Z1DRDLulJz6thTAL%2FzIsln2HRSF29dxF%2BXS6HxQo%2F1A3yHMkdR337C%2FKR8KRXsoD&noverify=0&group_code=693720600")}>
                            <div className={'BtnContent'}>
                                <img alt={'qqqun'} src={'https://qq-web.cdn-go.cn//im.qq.com_new/7bce6d6d/asset/favicon.ico'}></img>
                                <span>粉丝群693720600</span>
                            </div>
                        </Button>
                        <div style={{
                            color: "rgba(0,0,0,0.3)"
                        }}>
                            Made&nbsp;by&nbsp;
                            <a
                                href={"https://space.bilibili.com/37141"}
                                target='_blank'
                                rel="noreferrer"
                                style={{
                                    color: "rgba(0,0,0,0.5)",
                                    textDecoration: "underline"
                                }}>御坂
                            </a><br></br>
                            Powered&nbsp;by&nbsp;
                            <a
                                href={"https://github.com/Jeffz615/v-song-list"}
                                target='_blank'
                                rel="noreferrer"
                                style={{
                                    color: "rgba(0,0,0,0.5)",
                                    textDecoration: "underline"
                                }}>v-song-list
                            </a>
                        </div>
                    </Row>
                </Drawer>
            </Content>
        </Layout>
    );
}

export default App;
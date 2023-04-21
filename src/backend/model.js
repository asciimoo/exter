import url from 'node:url';

import { Sequelize, Model, DataTypes, Op } from 'sequelize';


import { config } from './config.js';


const db = new Sequelize(config.dbConn, {
    logging: config.dbDebug
});

const URL = db.define('URL', {
    href: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    protocol: DataTypes.STRING,
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    host: DataTypes.STRING,
    port: DataTypes.INTEGER,
    path: DataTypes.STRING,
    query: DataTypes.STRING,
    anchor: DataTypes.STRING,
});

const Request = db.define('Request', {
    statusCode: DataTypes.INTEGER,
    contentType: DataTypes.STRING,
    created: DataTypes.DATE,
});

URL.hasMany(Request);
Request.belongsTo(URL);

const ExtKV = db.define('ExtKV', {
    ext: DataTypes.STRING,
    key: DataTypes.STRING,
    value: DataTypes.STRING,
});

async function setExtKV(ext, k, v) {
    let d = await getExtKV(ext, k);
    if(d) {
        d.value = v;
        await d.save();
    } else {
        await ExtKV.create({
            ext: ext,
            key: k,
            value: v,
        });
    }
}

async function getExtKV(ext, k) {
    const ret = await ExtKV.findAll({
        where: {
            ext: ext,
            key: {
                [Op.Eq]: k
            }
        }
    });
    if(!ret) {
        return;
    }
    return ret[0];
}

async function addRequest(URLString, statusCode, contentType) {
    const u = url.parse(URLString);
    let urlo = await URL.findOne({where: {href: u.href}});
    if(!urlo) {
        urlo = await URL.create({
            href: u.href,
            protocol: u.protocol,
            host: u.host,
            port: Number(u.port),
            path: u.pathname,
            query: u.search ? u.search.substring(1) : '',
            anchor: u.hash ? u.hash.substring(1) : '',
        });
    }
    await Request.create({
        statusCode: statusCode,
        contentType: contentType,
        created: new Date(),
        URLId: urlo.Id,
    });
}


// TODO https://sequelize.org/docs/v6/other-topics/migrations/ instead of "alter: true"
await db.sync({alter: true});

export {
    URL,
    addRequest,
    Request,
    setExtKV,
    getExtKV,
};

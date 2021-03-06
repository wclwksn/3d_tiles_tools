
import{Envelope3D}from "./envelop3D";

export class TreeNode<T>
{

    //morton码，用于计算最终的行列号
    private _morton=0;
     /// <summary>
        /// The child nodes of the QuadTree
        /// /// <summary>
        /// subquads are numbered as follows:
        /// 2 | 3
        /// --+--
        /// 0 | 1
        /// </summary>
    _nodes:TreeNode<T>[]=new Array();
    _tag:any;
    //存储内容的最小范围
    _contentEnvelope:Envelope3D;
    //树的级别
    _level:number;
    _centerX:number;
    _centerY:number;
    //当前四叉树节点的范围，其范围是大于内容的范围
    _bounds:Envelope3D;
    //当前存储的节点内容
    private _contents:T[]=new Array();
    

    get Contents():T[]
    {
        return this._contents;
    }

    get Morthon():number
    {
        return this._morton;
    }
    
     set Morthon(v : number) {
        this._morton = v;
    }
    
     
    public constructor(env:Envelope3D,level:number)
    {
        this._bounds=env;
        this._level=level;
        this._centerX=(env.MinX+env.MaxX)/2;
        this._centerY=(env.MinY+env.MinY)/2;
    }


    
    


    ///返回树的最大深度
     get Depth():number
     {
         var maxSubDepth=0;
         for (var index = 0; index < 4; index++) {
             var element = this._nodes[index];
             if (element!=null) {
                 let sqd=element.Depth;
                 if (sqd>maxSubDepth) {
                     maxSubDepth=sqd;
                 }
             }
         }
         return maxSubDepth+1;
     } 


     //获取和设置节点绑定的内容
     get Tag():any
     {
         return this._tag;
     }

     set Tag(value:any)
     {
         this._tag=value;
     }

     get ContentEnvelope():Envelope3D
     {
         return this._contentEnvelope;
     }

     /* get TileX():number
     {
         let _x=0;        
         for (var i = 0; i < 64; i=2) {
             _x+=((this._morton>>i)&1)<<(i/2);            
         }
         return _x;
     } */

     /* get TileY():number
     {
         let _y=0;
         for (var i = 0; i <64; i+=2) {
             _y+=((this._morton>>i)&1)<<((i-1)/2);             
         }
         return _y;
     } */

     get Level():number
     {
         return this._level;
     }


     get SubNodes():TreeNode<T>[]
     {
         return this._nodes;
     }

     //四叉树是二维分割，因此在处理三维的情况时需要把可能的高度也返回出来
     get Bounds():Envelope3D
     {
         //如果当前不存在Conent也即当前节点为空时，为了确定高度，查询其子节点的bounds一般子节点是不为空的。
         if(this._contentEnvelope){
            this._bounds.ExpandToInclude(this.ContentEnvelope);
         }else
         {
             this.SubNodes.forEach(subNode=>{subNode?this._bounds.ExpandToInclude(subNode.Bounds):null;});
         }
         return this._bounds;
     }
     
     //插入的代码写在QuadTree中，这里仅作基本的插入
     public Insert(item:T,env:Envelope3D)
     {
         //添加此节点内容
          this._contents.push(item);
          //扩大ContentBounds的范围
          if(!this._contentEnvelope) {this._contentEnvelope=env;return;}
          this.ContentEnvelope.ExpandToInclude(env);

     }

     public InsertEx(item:T,env:Envelope3D,callback:any)
     {
         //添加此节点内容
          this._contents.push(item);
          //扩大ContentBounds的范围
          if(!this._contentEnvelope) {this._contentEnvelope=env;return;}
          this.ContentEnvelope.ExpandToInclude(env);
          callback(this);
     }
      

     //根据指定的限制，确定待插入节点
     public GetNode(env:Envelope3D, maxLevel:number):TreeNode<T>
     {
         if(this._level>=maxLevel)
         return this;
         let subnodeIndex=this.GetSubnodeIndex(env);
         if(subnodeIndex!=-1){
            let node=this.SubNodes[subnodeIndex];
            if(node==null) node=this.CreateSubNode(subnodeIndex);
            return node.GetNode(env,maxLevel);
         }
         return this;
     }


     ///获取某个范围在此节点的哪个象限
     public GetSubnodeIndex(env:Envelope3D)
     {
        let subnodeIndex = -1;
        if (env.MinX >= this._centerX)
        {
            if (env.MinY >= this._centerY)
                subnodeIndex = 3;
            if (env.MaxY <= this._centerY)
                subnodeIndex = 1;
        }
        if (env.MaxX <= this._centerX)
        {
            if (env.MinY >= this._centerY)
                subnodeIndex = 2;
            if (env.MaxY <= this._centerY)
                subnodeIndex = 0;
        }
        return subnodeIndex;
     }

     //创建子节点
     public CreateSubNode(index: number) {
         let minx = 0, maxx = 0, miny = 0, maxy = 0;
         switch (index) {
             case 0:
                 minx = this._bounds.MinX;
                 maxx = this._centerX;
                 miny = this._bounds.MinY;
                 maxy = this._centerY;
                 break;
             case 1:
                 minx = this._centerX;
                 maxx = this._bounds.MaxX;
                 miny = this._bounds.MinY;
                 maxy = this._centerY;
                 break;
             case 2:
                 minx = this._bounds.MinX;
                 maxx = this._centerX;
                 miny = this._centerY;
                 maxy = this._bounds.MaxY;
                 break;
             case 3:
                 minx = this._centerX;
                 maxx = this._bounds.MaxX;
                 miny = this._centerY;
                 maxy = this._bounds.MaxY;
                 break;
             default:
                 break;
         }
         //向下划分时不能确定外包盒的高度，因此暂时指定为0，因此树构件完毕后其最大高度将于Cotent的高度相同
         let sqEnv = new Envelope3D(minx, maxx, miny, maxy, 0, 0);
         //子节点级别+1
         let nodes = new TreeNode<T>(sqEnv, this._level + 1);
         this._nodes[index]=nodes;
         //计算morton码
         nodes.Morthon = (this._morton << 2) + index;
         return nodes;
     }  
    



     










     
     
     








}
/* Creates line graph visualization for webpage */
function draw_pack_hierarchy(areaID) {
    // load data file, process data, and draw visualization
    var url = ghDataDir + '/labUsers.json';
    d3.json(url, function(obj) {
        var data = reformatData(obj);
        drawGraph(data, areaID);
    });

    function drawGraph(data, areaID) {
        const margin = { top: stdMargin.top, right: stdMargin.right, bottom: stdMargin.bottom, left: stdMargin.left },
            width = stdTotalWidth * 2 - margin.left - margin.right,
            height = stdHeight * 2 - margin.top - margin.bottom;

        const colors = ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"];

        const chart = d3
            .select('.' + areaID)
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                    .attr('viewBox', `0 0 ${Math.min(width, height)} ${Math.min(width, height)}`);

        const pack = data => d3.pack()
            .size([width, height])
            .padding(2)
            (d3.hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value));

        const root = pack(data);
        console.debug(root);
        const center = [root.x,root.y];
        const maxRadius = root.r;
        let view;
        let focus = root;

        const nodeGroup = chart.append('g');

        const node = nodeGroup
            .selectAll('g')
            .data(d3.nest().key(d => d.height).entries(root.descendants()))
            .enter()
                .append('g')
                    .selectAll('g')
                    .data(d => d.values)
                    .enter()
                        .append('g')
                            .attr("transform", d => `translate(${d.x},${d.y})`);
        
        const parentNodes = node.filter(d => d.children != undefined); 
        const childNodes = node.filter(d => d.children == undefined);

        let label = chart.selectAll('text')
            .data(focus.children)
            .enter()
                .append('text')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .attr('dy', '0.35em')
                    .style('cursor', 'pointer')
                    .text(d => d.data.name)
                    .on('click', clicked);
        
        const parentCircles = parentNodes.append('circle')
            .attr('fill', d => colors[d.height + 1])
            .attr('r', d => d.r)
            .style('cursor', 'pointer');

        const childCircles = childNodes.append('circle')
            .attr('fill', d => colors[d.height + 1])
            .attr('r', d => d.r);
        
        parentCircles.on('click', clicked);

        parentCircles.append('title')
            .text(d => d.data.name);
        
        childNodes.append('title')
            .text(d => d.data.name);

        function clicked(o) {
            if (focus !== o) {
                zoom(o);
                d3.event.stopPropagation();
            }
        }

        getZoom([center[0], center[1], maxRadius * 2]);

        function zoom(d) {
            const focus_0 = focus;

            focus = d;

            label.remove();

            label = chart.selectAll('text')
            .data(focus.children)
            .enter()
                .append('text')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .attr('dy', '0.35em')
                    .attr('fill-opacity', 0)
                    .style('cursor', d => {
                        if (d.children == undefined) {
                            return 'default';
                        } else {
                            return 'pointer';
                        }
                    })
                    .text(d => d.data.name.length > 10 ? '' : d.data.name)
                    .on('click', d => {
                        if (d.children != undefined) {
                            clicked(d);
                        }
                    });

            childCircles.attr('fill-opacity', 0);

            const transition = chart.transition()
                .duration(750)
                .tween('zoom', d => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => getZoom(i(t));
                });

            label.transition(transition).attr('fill-opacity', 1);

            getChildZoom([focus.x, focus.y, focus.r * 2]);
            setTimeout(() => childCircles.transition().duration(200).attr('fill-opacity', 1), 750);
        }

        function getZoom(v) {
            const k = Math.min(width / v[2] , height / v[2]);

            view = v;

            label.attr('transform', d => `translate(${(d.x - v[0]) * k + center[0]},${(d.y - v[1]) * k + center[1]})`);
            parentNodes.attr('transform', d => `translate(${(d.x - v[0]) * k + center[0]},${(d.y - v[1]) * k + center[1]})`);
            parentCircles.attr('r', d => d.r * k);
        }

        function getChildZoom(v) {
            const k = Math.min(width / v[2] , height / v[2]);

            childNodes.attr('transform', d => `translate(${(d.x - v[0]) * k + center[0]},${(d.y - v[1]) * k + center[1]})`);
            childCircles.attr('r', d => d.r * k);
        }

    }

    // Turn json obj into desired working data
    function reformatData(obj) {
        var data = { name: 'LLNL', children: [] };
        for (var user in obj['data']) {
            if (obj['data'][user]['contributedLabRepositories'] === undefined) {
                continue;
            }
            for (var ownerRepo of obj['data'][user]['contributedLabRepositories']['nodes']) {
                let owner = ownerRepo.split('/')[0];
                let repo = ownerRepo.split('/')[1];
                if (!data.children.some(d => d.name == owner)) {
                    data.children.push({ name: owner, children: [] });
                }
                let indexOfOwner = data.children.findIndex(d => d.name == owner);
                if (!data.children[indexOfOwner].children.some(d => d.name == repo)) {
                    data.children[indexOfOwner].children.push({ name: repo, children: [] });
                }
                let indexOfRepo = data.children[indexOfOwner].children.findIndex(d => d.name == repo);
                data.children[indexOfOwner].children[indexOfRepo].children.push({ name: user, value: 1 });
            }
        }
        
        return data;
    }
}
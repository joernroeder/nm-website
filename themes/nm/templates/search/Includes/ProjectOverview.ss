<section>
<ul>
	<% loop Projects %>
	<li>
		<article>
			<header>
				<h3><a href="/portfolio/{$UglyHash}/">$Title</a></h3>
				<% if PreviewImage %>
					<% with PreviewImage.Images.First %>
						<div>
							<img src="{$Link}" />
						</div>
					<% end_with %>
				<% end_if %>

				<p>
					<% if Persons.Count > 3 %>
						Group project
					<% else %>
						<ul>
							<% loop Persons %>
								<li><a href="/about/{$UrlSlug}/">$FullName</a></li>
							<% end_loop %>
						</ul>
					<% end_if %>
				</p>
				<p>
					<% if DateRangeNice %>
						$DateRangeNice
					<% else %>
						<% if Date %>
							$Date.Year
						<% end_if %>
					<% end_if %>
				</p>
			</header>
			<section>
				<p>$MarkdownedTeaser</p>
				<p><a href="/portfolio/{$UglyHash}/">Read more</a></p>
			</section>
		</article>
	</li>
	<% end_loop %>
</ul>
</section>